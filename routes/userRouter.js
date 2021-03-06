const Mongoose = require('mongoose')
const router = require('express').Router()
const passport = require('passport');
require('../config/passportConfig')(passport)

const {User} = require('../models/userModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const {updateData, isRole} = require('../middlewares/auth.js')

const cloudinary = require('../config/cloudinaryConfig') 
const {MulterImage, MulterTrack} = require('../config/multer')

require('dotenv').config();

//---------------------------ПОЛЬЗОВАТЕЛЬ-------------------------------------

//middleware
router.use((req, res, next) => {
    next();
});
//Логин
router.post('/login', (req, res)=>{
    User.findOne({nickname: req.body.nickname}, (err, user)=>{
        if (err) return console.log(err)
        if (!user) return console.log('Пользователь не найдей')
        bcrypt.compare(req.body.password, user.password, (err, result)=>{
            if (err) return console.log(err)
            if (result === false){
                return res.status(401).send('Пароль не верный')
            }
            if (result === true){
                const payload = user.toJSON()

                jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 3600}, (err, token)=>{
                    if(err) console.log(err)
                    return res.send({
                        success: true,
                        token: 'Bearer ' + token
                    })
                })
            }
        }) 
    })
    // (req, res, next)
    // passport.authenticate('local',  (err, user, info)=>{
    //     if(err) return res.status(404).send(err);
    //     if(!user) return res.status(200).send('Такого пользователя не существует')
    //     else{
    //         updateData(user)

    //         const payload = user.toJSON()

    //         jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'}, (err, token)=>{
    //             if(err) console.log(err)
    //             res.send({
    //                 success: true,
    //                 token: 'Bearer ' + token
    //             })
    //         })
    //     }
    // })
})
//Регистация
router.post('/register', async (req, res)=>{
    const emailRegExp = RegExp('^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$')
    const nickRegExp = RegExp('^(?=[a-z0-9_]{4,30}$)(?!.*[_.]{2})[^_.].*[^_.]$')
    const email = req.body.email.match(emailRegExp)
    const nick = req.body.nickname.match(nickRegExp)
    if(email && nick){
        User.findOne({$or:[{nickname: req.body.nickname},{email: req.body.email}]}, async (err, doc)=>{
            if(err) res.status(404).send(err);
            if(doc) res.status(200).send('Пользователь уже существует')
            if(!doc) {
                const hashedPass = await bcrypt.hash(req.body.password, 10)
                const newUser = new User({
                    nickname: req.body.nickname,
                    email: req.body.email,
                    password: hashedPass
                })
                await newUser.save();
                res.status(200).send('Пользователь успешно создан')
            }
        })
    }
    else{
        var response = 'Данные не верны '
        if(!email){
            response += 'Неправильный e-mail '
        }
        if(!nick){
            response += 'Неправильный nickname '
        }
        return res.send(response)
    }
})
//Получение пользователя с сервера
router.get('/', passport.authenticate('jwt', {session: false}), (req, res)=>{
    res.send(req.user)
})
//Выйти из уч. записи
router.post('/logout', passport.authenticate('jwt', {session: false}), (req, res)=>{
    try{
        req.logout();   
        res.send('Вы успешно вышли')
    }
    catch(err){
        res.send(err)
    }
})
//---------------------------ПРОФИЛЬ-------------------------------------
router.get('/getPosts/:id', async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        let { size, page } = req.query

        if (!size) size = 10;
        if (!page) page = 1;

        if(page < 1) return res.status(404).send('Неверная страница');

        const limit = parseInt(size)
        const skip = (page - 1) * size;

        User.findOne({nickname: id}, null, {sort: {createdAt: -1}}, async(err, doc)=>{
            if(err)  return res.status(404).send(err);
            if(!doc) return res.status(200).send('Запись не найдена');
            if(doc){
                let posts = doc.posts?.slice(skip, limit + skip)
                return res.status(200).send({
                    pages: Math.ceil(doc.posts?.length/size),
                    data: posts,
                })
            }
        })
    }
})
//Создать пост
router.post('/createPost', 
passport.authenticate('jwt', {session: false}), 
MulterTrack.fields([{name: 'track', maxCount: 1}, {name: 'image', maxCount: 1}]), 
async(req, res)=>{
    console.log(req.user.nickname)
    console.log(req.body.text)
    if(req.user?.nickname){
        User.findOneAndUpdate({nickname: req.user.nickname}, {$push: {'posts': {text: req.body.text}}},async(err, doc)=>{
            if(err)  return res.status(404).send(err);
            if(!doc) return res.status(200).send('Запись не найдена');
            if(doc){
                console.log(doc.posts)
                return res.status(200).send('Ok')
            }
        })
    }
})
//Удалить пост
router.get('/deletePost/:id', passport.authenticate('jwt', {session: false}), async(req, res)=>{
    if(req.params.id){
        const id = req.params.id
        User.findByIdAndUpdate(req.user._id, {$pull: {posts: {_id: Mongoose.Types.ObjectId(id)}}}, {new: true},async(err, doc)=>{
            if(err)  return res.status(404).send(err);
            if(!doc) return res.status(200).send('Запись не найдена');
            if(doc){
                return res.status(200).send('Ok')
            }
        })
        
    }
})
//ЛАЙКИ


//Поменять аватар
router.post('/change_avatar', passport.authenticate('jwt', {session: false}), MulterImage.single('image'),  async (req, res)=>{
    User.findOne({nickname: req.user.nickname}, async (err, doc)=>{
        if(err) return console.log(err);
        if(!doc) return res.send('Запись не найдена');
        if(doc){
            try{
                await cloudinary.uploader.destroy(req.user.avatarID)
            }
            catch(e){
                console.log(e)
            }
            try{
                const result = await cloudinary.uploader.upload(req.file.path)

                User.updateOne({nickname: req.user.nickname},{avatarURL: result.secure_url, avatarID: result.public_id}, async (err, doc)=>{
                    if(err) return res.status(404).send(err);
                    if(!doc) return res.status(400).send('Запись не найдена');
                    if(doc){
                        return res.status(200).send('Фотография обновлена')
                    }
                })
            }
            catch(e){
                console.log(e)
            }
        }
    })
    
})
//Изменить содержимое поля about
router.post('/change_about', passport.authenticate('jwt', {session: false}), async (req, res)=>{
    User.updateOne({nickname: req.user.nickname},{$set: {about: req.body.about}}, async (err, doc)=>{
        if(err)  res.status(404).send(err);
        if(!doc) res.status(400).send('Запись не найдена');

        if(doc) res.status(200).send('Обновлено');
    })
    
})
//---------------------------ПРОФИЛЬ(ЧУЖОЙ)-------------------------------------
router.get('/:id', function(req, res, next) {
        passport.authenticate('jwt', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return next(); }
            req.login(user, next);
        })(req, res, next);
    }, 
async (req, res)=>{
    if(req.params.id){
        const id = req.params.id

        User.findOne({nickname: id}, async(err, doc)=>{
            if(err)  return res.status(404).send(err);
            if(!doc) return res.status(400).send('Запись не найдена');
            if(doc){
                if(req.user?.nickname){
                    User.findOneAndUpdate({nickname: id}, {$addToSet: {visitors: req?.user?.nickname}}, async (err, doc)=>{
                        if(err) console.log(err);
                        if(!doc) console.log('Запись не найдена');
                        if(doc){

                        }
                    })
                }
                return res.status(200).send(doc)
            }
        })
    }
})
//Проверка подписан ли пользователь на другого пользователя
router.get('/isFollowed/:id', passport.authenticate('jwt', {session: false}), async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        const followers = req.user?.youFollow

        if(followers){
            if(followers.includes(id)){
                return res.status(200).send(true)
            }
            else{
                return res.status(200).send(false)
    
            }
        }
    }
})
//Подписаться на пользователя
router.get('/setFollow/:id', passport.authenticate('jwt', {session: false}), async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        if(req.user?.nickname){
            User.findOneAndUpdate({nickname: id}, {$addToSet: {followers: req.user.nickname}},async(err, doc)=>{
                if(err)  res.status(404).send(err);
                if(!doc) res.status(200).send('Запись не найдена');
                if(doc){
                        User.findOneAndUpdate({nickname: req.user.nickname}, {$addToSet: {youFollow: id}}, async (err, doc)=>{
                            if(err) console.log(err);
                            if(!doc) console.log('Запись не найдена');
                            if(doc){
                                return res.status(200).send(true)
                            }
                        })
                }
            })
        }
    }
})
//Отписаться от пользователя
router.get('/setUnFollow/:id', passport.authenticate('jwt', {session: false}), async(req, res)=>{
    if(req.params.id){
        const id = req.params.id

        if(req.user?.nickname){
            User.findOneAndUpdate({nickname: id}, {$pull: {followers: req.user.nickname}},async(err, doc)=>{
                if(err)  res.status(404).send(err);
                if(!doc) res.status(200).send('Запись не найдена');
                if(doc){
                        User.findOneAndUpdate({nickname: req.user.nickname}, {$pull: {youFollow: id}}, async (err, doc)=>{
                            if(err) console.log(err);
                            if(!doc) console.log('Запись не найдена');
                            if(doc){
                                return res.status(200).send(false)
                            }
                        })
                }
            })
        }
    }
})

module.exports = router;