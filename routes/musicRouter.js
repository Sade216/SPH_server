const router = require('express').Router()
const passport = require('passport');
require('../config/passportConfig')(passport)

const {MulterImage, MulterTrack} = require('../config/multer')

const cloudinary = require('../config/cloudinaryConfig')

const Music = require('../models/musicModel.js');
const {User} = require('../models/userModel.js');

const {isRole} = require('../middlewares/auth')

router.use((req, res, next) => {
    next();
});
//Получения всей музыки
router.get('/getAll', (req,res)=>{
    let { limit, page, sort = -1 } = req.query

    if (!limit) limit = 5;
    if (!page) page = 1;

    if(page < 1) return res.status(404).send('Неверная страница');

    const size = parseInt(limit)
    const skip = (page - 1) * limit;

    let musicCount

    Music.count({}, async (err, count)=>{
        if(count){
            musicCount = count
            Music.find({}, null, {sort: {createdAt: -1}}, (err, doc)=>{
                if(err) res.status(404).send(err)
                if(!doc) res.status(404).send('Запись не найдена (')
                if(doc) {
                    res.status(200).send({
                        pages: Math.ceil(musicCount/limit),
                        data: doc,
                    })
                }
            }).limit(size).skip(skip)
        }
        else res.status(400).send('Пусто')
    })
})
//Получения коллекции
router.get('/getCollection/:id', async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        User.findOne({nickname: id}, null, {sort: {createdAt: -1}}, async(err, doc)=>{
            if(err)  res.status(404).send(err);
            if(!doc) res.status(400).send('Запись не найдена');
            if(doc){
                res.status(200).send(doc.trackList)
                
            }
        })
    }
})
//Получение коллекции для авторизованного пользователя
router.get('/getCollection', passport.authenticate('jwt', {session: false}),async(req, res)=>{
    if(req.user.nickname){

        User.findOne({nickname: req.user.nickname}, null, {sort: {createdAt: -1}}, async(err, doc)=>{
            if(err)  res.status(404).send(err);
            if(!doc) res.status(400).send('Запись не найдена');
            if(doc){
                res.status(200).send(doc.trackList)
                
            }
        })
    }
})
//Получения данных о треке
router.get('/getTrackData/:id', async(req, res)=>{
    if(req.params.id){
        const id = req.params.id
        Music.findOne({trackID: id}, async(err, doc)=>{
            if(err)  return res.status(404).send(err);
            if(!doc) return res.status(400).send('Запись не найдена');
            if(doc){
                return res.status(200).send(doc)
            }
        })
    }
})
router.post('/setTimesListened', passport.authenticate('jwt', {session: false}), async (req, res)=>{
    if(req.body.id){
        const id = req.body.id
        Music.findByIdAndUpdate(id, {$addToSet: {timesListened: req.user.nickname}},async(err, doc)=>{
            if(err)  return res.status(404).send(err);
            if(!doc) return res.status(400).send('Запись не найдена');
            if(doc){
                return res.status(200).send('ok')
            }
        })
    }
    else{
        return res.status(404).send('ups')
    }
    
})
//Добавление
router.post('/addTrack', passport.authenticate('jwt', {session: false}),
    MulterTrack.fields([{name: 'track', maxCount: 1}, {name: 'image', maxCount: 1}]), 
    isRole(['member', 'editor','admin']), 
    async (req, res)=>{
    let status = {
        trackStatus: false,
        pictureStatus: false,
        trackUploadStatus: false,
        pictureUploadStatus: false,
    }
    
    const TrackRegExp = RegExp('\.(mp3|wav)$')
    const ImageRegExp = RegExp('\.(jpg|jpeg|png)$')
    let resultTrack
    let resultImage
    try{
        if(req.files['track'][0].originalname.match(TrackRegExp)){
            resultTrack = await cloudinary.uploader.upload(req.files['track'][0].path, {resource_type: 'video'})
            status.trackStatus = true
        }
    }
    catch(e){
        status.trackStatus = false
        return res.status(400).send('Трека нет')
    }
    try{
        if(req.files['image'][0].originalname.match(ImageRegExp)){
            resultImage = await cloudinary.uploader.upload(req.files['image'][0].path)
            status.pictureStatus = true
        }
    }
    catch(e){
        status.pictureStatus = false
        console.log('Без картинки')
    }
    let imagePublicID
    let imageSecureURL
    if(resultImage === undefined) {
        imagePublicID = ''
        imageSecureURL = ''
    }
    else{
        imagePublicID = resultImage.public_id
        imageSecureURL = resultImage.secure_url
    }
    try {     
        Music.find({}, async (err, doc)=>{
            if(err) return res.status(404).send(err);
            const newTrack = new Music({
                trackID: resultTrack.public_id,
                trackURL: resultTrack.secure_url,
                imageID: imagePublicID,
                imageURL: imageSecureURL, 
                author: req.user.nickname,
                title: req.body.title ? req.body.title : null,
                tags: req.body.tags,
                desc: req.body.desc,
            })
            await newTrack.save();
            status.trackUploadStatus = true
        })
        User.findOneAndUpdate({nickname: req.user.nickname},
            {$addToSet : { trackList: resultTrack.public_id}}, 
            async (err, doc)=>{
                if(err) return res.status(404).send(err);
                if(!doc) return res.status(400).send('Запись не найдена');
                if(doc){
                    status.pictureUploadStatus = true
                }
            }
        )
        return res.status(200).send(status)
    } catch (e) {
        console.log(e)
    }
})
//Удаление
router.post('/deleteTrack', passport.authenticate('jwt', {session: false}), async(req, res)=>{

    if(req?.user?.nickname === req?.body?.author | req?.user?.role === 'admin'){
        let trackID = req.body.trackID
        Music.deleteOne({trackID: trackID}, async(err, doc)=>{
            User.findOneAndUpdate({nickname: req.user.nickname}, {$pull: {trackList: trackID}}, async (err, doc)=>{
                if(err) console.log(err);
                if(!doc) console.log('Запись не найдена');
                if(doc){
                    try{
                        await cloudinary.uploader.destroy(trackID, {resource_type: 'video'})
                        await cloudinary.uploader.destroy(req.body.imageID)
                    }
                    catch(e){

                    }
                    return res.status(200).send('Вы удалили свой трек(')
                }
            })
            
        })
    }
    else{
        return res.status(400).send('Вы не владелец')
    }
})
//Изменение
router.post('/changeTrackInfo', passport.authenticate('jwt', {session: false}), async(req, res)=>{

    // if(req?.user?.nickname !== req?.body?.author){
    //     return res.status(400).send('Вы не владелец')
    // }
    // else{
    //     let trackID = req.body.trackID
    //     Music.deleteOne({trackID: trackID}, async(err, doc)=>{
    //         console.log('Delete Track')
    //         User.findOneAndUpdate({nickname: req.user.nickname}, {$pull: {trackList: trackID}}, async (err, doc)=>{
    //             if(err) console.log(err);
    //             if(!doc) console.log('Запись не найдена');
    //             if(doc){
    //                 try{
    //                     await cloudinary.uploader.destroy(trackID, {resource_type: 'video'})
    //                     await cloudinary.uploader.destroy(req.body.imageID)
    //                 }
    //                 catch(e){

    //                 }
    //                 return res.status(200).send('Вы удалили свой трек(')
    //             }
    //         })
            
    //     })
        
    // }
})

module.exports = router;