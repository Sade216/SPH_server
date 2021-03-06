const router = require('express').Router()
const passport = require('passport');
require('../config/passportConfig')(passport)

const News = require('../models/newsModel.js');
const {User} = require('../models/userModel.js');

const {isRole} = require('../middlewares/auth.js')

router.use((req, res, next) => {
    next();
});

//Получение всех постов
router.get('/getAll', (req, res)=>{
    let { size, page } = req.query

    if (!size) size = 3;
    if (!page) page = 1;

    if(page < 1) return res.status(404).send('Неверная страница');

    const limit = parseInt(size)
    const skip = (page - 1) * size;

    let newsCount

    News.count({}, async (err, count)=>{
        if(count){
            newsCount = count
            News.find({}, (err, doc)=>{
                if(err) res.status(404).send(err)
                if(!doc) res.status(404).send('Запись не найдена (')
                if(doc) {
                    res.status(200).send({
                        pages: Math.ceil(newsCount/size),
                        data: doc,
                    })
                }
            }).limit(limit).skip(skip)
        }
        else res.status(400).send('Что-то пошло не так (')
    })
})
//Получение одного поста
router.get('/getOne', (req, res)=>{

})
//------------------------LIKE & COMMENTS--------------------------------
router.get('/isLikedNews/:id', passport.authenticate('jwt', {session: false}), isRole(['member', 'owner', 'admin']), async (req, res)=>{
    if(req.params.id){
        const id = req.params.id
        News.findById(id, async (err, doc)=>{
            if(err) return res.status(404).send(err)
            if(!doc) return res.status(404).send('Запись не найдена')
            if(doc){
                if(doc.likes.includes(req.user.nickname)){
                    return res.status(200).send({
                        status: true,
                        length: doc.likes.length
                    })
                }
                else{
                    return res.status(200).send({
                        status: false,
                        length: doc.likes.length
                    })
                }
            }
        })
    }
})
router.post('/setLike', passport.authenticate('jwt', {session: false}), isRole(['member', 'owner', 'admin']), async (req, res)=>{
    const id = req.body.id
    News.findByIdAndUpdate(id, {$addToSet: {likes: req.user.nickname}}, {new: true} ,(err, doc)=>{
        if(err) return res.status(404).send(err)
        if(!doc) return res.status(404).send('Запись не найдена')
        if(doc){
            return res.status(200).send({
                status: true,
                length: doc.likes.length
            })
        }
    });
})
router.post('/setUnLike', passport.authenticate('jwt', {session: false}), isRole(['member', 'owner', 'admin']), async (req, res)=>{
    const id = req.body.id
    News.findByIdAndUpdate(id, {$pull: {likes: req.user.nickname}}, {new: true} ,(err, doc)=>{
        if(err) return res.status(404).send(err)
        if(!doc) return res.status(404).send('Запись не найдена')
        if(doc){
            return res.status(200).send({
                status: false,
                length: doc.likes.length
            })
        }
    });
})
router.post('/addComment', passport.authenticate('jwt', {session: false}), isRole(['member' , 'owner']), (req, res)=>{
    const id = req.body.id
    News.findOneAndUpdate({ _id: id }, {$addToSet: {likes: req.user.nickname}}, {} ,(err, doc)=>{
        if(err) res.status(404).send(err)
        if(!doc) res.status(404).send('Запись не найдена')
        if(doc){
            res.status(200).send('ok')
        }
    });
})
//------------------------Админ-панель--------------------------------
//Создание поста
router.post('/create', passport.authenticate('jwt', {session: false}), isRole(['owner']), (req, res)=>{
    News.find({title}, async(err, doc)=>{
        if(err) res.status(404).send(err)
        if(doc) res.status(400).send('Новость с таким же названием уже существует')
        if(!doc) {
            const newNews = new News({
                author: req.body.author,
                title: req.body.title,
                text: req.body.text,
                picture: req.body.picture,
                tags: [req.body.tags],
            })
            await newNews.save();
            res.status(200).send('Новость успешно создана')
        }
    })
})
//Удаление поста
router.delete('/:id', passport.authenticate('jwt', {session: false}), isRole(['owner']), (req, res)=>{
    const asd = [];
})
//Обновление поста
router.put('/:id', passport.authenticate('jwt', {session: false}), isRole(['owner']), (req, res)=>{
    const asd = [];
})

module.exports = router;