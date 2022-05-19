const router = require('express').Router()
const passport = require('passport');
require('../config/passportConfig')(passport)

const {MulterImage, MulterTrack} = require('../config/multer')

const cloudinary = require('../config/cloudinaryConfig')

const Music = require('../models/musicModel.js');
const User = require('../models/userModel.js');

const {isRole} = require('../middlewares/auth')

router.use((req, res, next) => {
    next();
});

router.get('/getAll', (req,res)=>{
    let { size, page } = req.query

    if (!size) size = 5;
    if (!page) page = 1;

    if(page < 1) return res.status(404).send('Неверная страница');

    const limit = parseInt(size)
    const skip = (page - 1) * size;

    let musicCount

    Music.count({}, async (err, count)=>{
        if(count){
            musicCount = count
            Music.find({}, (err, doc)=>{
                if(err) res.status(404).send(err)
                if(!doc) res.status(404).send('Запись не найдена (')
                if(doc) {
                    res.status(200).send({
                        pages: Math.ceil(musicCount/size),
                        data: doc,
                    })
                }
            }).limit(limit).skip(skip)
        }
        else res.status(400).send('Что-то пошло не так (')
    })
})

router.get('/getCollection/:id', async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        User.findOne({nickname: id}, async(err, doc)=>{
            if(err)  res.status(404).send(err);
            if(!doc) res.status(400).send('Запись не найдена');
            if(doc){
                res.status(200).send(doc.trackList)
                
            }
        })
    }
})

router.get('/getTrackData/:id', async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        Music.findOne({trackID: id}, async(err, doc)=>{
            if(err)  res.status(404).send(err);
            if(!doc) res.status(400).send('Запись не найдена');
            if(doc){
                // if(req?.user?.nickname){
                //     User.findOneAndUpdate({nickname: req.user.nickname}, {$addToSet: {pref_genres: doc.tags}})
                //     console.log(doc.tags)
                // }
                res.status(200).send(doc)
            }
        })
    }
})

router.post('/deleteTrack', passport.authenticate('jwt', {session: false}), async(req, res)=>{

    if(req?.user?.nickname !== req?.body?.author){
        return res.status(400).send('Вы не владелец')
    }
    else{
        let trackID = req.body.trackID
        Music.deleteOne({trackID: trackID}, async(err, doc)=>{
            console.log('Delete Track')
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
})

router.post('/addTrack', 
	passport.authenticate('jwt', {session: false}),
    MulterTrack.fields([{name: 'track', maxCount: 1}, {name: 'image', maxCount: 1}]), 
    isRole(['member', 'editor','admin']), 
    async (req, res)=>{

    const TrackRegExp = RegExp('\.(mp3|wav)$')
    const ImageRegExp = RegExp('\.(jpg|jpeg|png)$')
    let resultTrack
    let resultImage
    try{
        if(req.files['track'][0].originalname.match(TrackRegExp)){
            console.log('track')
            resultTrack = await cloudinary.uploader.upload(req.files['track'][0].path, {resource_type: 'video'})
        }
    }
    catch(e){
        return res.status(400).send('Трека нет')
    }
    try{
        if(req.files['image'][0].originalname.match(ImageRegExp)){
            console.log('image')
            resultImage = await cloudinary.uploader.upload(req.files['image'][0].path)
        }
    }
    catch(e){
        console.log('Без картинки')
    }
    let status = ''
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
                title: req.body.title,
                tags: req.body.tags,
                desc: req.body.desc,
            })
            await newTrack.save();
            status += 'Трек добавлен '
        })
        User.findOneAndUpdate({nickname: req.user.nickname},
            {$addToSet : { trackList: resultTrack.public_id}}, 
            async (err, doc)=>{
                if(err) return res.status(404).send(err);
                if(!doc) return res.status(400).send('Запись не найдена');
                if(doc){
                    status += 'Обложка установлена'
                }
        })
        res.status(200).send(status)
    } catch (e) {
        console.log(e)
    }
})

module.exports = router;