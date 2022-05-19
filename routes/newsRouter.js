const router = require('express').Router()
const passport = require('passport');
require('../config/passportConfig')(passport)

const News = require('../models/newsModel.js');
const User = require('../models/userModel.js');

const {isRole} = require('../middlewares/auth.js')

router.use(passport.authenticate('jwt', {session: false}), (req, res, next) => {
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

router.post('/setLike', isRole(['member' , 'owner']), (req, res)=>{
    const id = req.body.id
    News.findOneAndUpdate({ _id: id }, {$addToSet: {likes: req.user.nickname}}, {} ,(err, doc)=>{
        if(err) res.status(404).send(err)
        if(!doc) res.status(404).send('Запись не найдена')
        if(doc){
            res.status(200).send('ok')
        }
    });
})

//------------------------ADMINKA--------------------------------
//Создание поста
router.post('/create', isRole(['owner']), (req, res)=>{
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
router.delete('/:id', isRole(['owner']), (req, res)=>{
})
//Обновление поста
router.put('/:id', isRole(['owner']), (req, res)=>{
})

module.exports = router;