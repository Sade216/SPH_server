const {User} = require('../models/userModel')
const bcrypt = require('bcryptjs');
// const localStrategy = require('passport-local').Strategy

const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

require('dotenv').config();

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = process.env.JWT_SECRET

module.exports = function(passport){
    passport.use(new JwtStrategy(opts, (jwt_payload, done)=>{
        User.findById({_id: jwt_payload._id}, (err, user)=>{
            if(err) return done(null, false)
            if(!user) return done(null, false)
            if(user){
                return done(null, user)
            }
        })
    }))

    passport.serializeUser((user, cb)=>{
        cb(null, user.id);
    })
    passport.deserializeUser((id, cb)=>{
        User.findOne({_id: id}, (err, user)=>{
            const userInfo = {
                nickname: user.nickname,
                email: user.email, 
                role: user.role,
                backgoundURL: user.backgoundURL,
                avatarURL: user.avatarURL,
                avatarID: user.avatarID,
                pref_genres: user.pref_genres,
                visitors: user.visitors,
                trackList: user.trackList,
                followers: user.followers,
                youFollow: user.youFollow,
            }
            cb(err, userInfo);
        })
    })

    // passport.use(
    //     new localStrategy({
    //         usernameField: 'nickname',
    //         passwordField: 'password'
    //       },(nickname , password, done)=>{
    //         User.findOne({nickname: nickname}, (err, user)=>{
    //             if (err) return done(null, false)
    //             if (!user) return done(null, false);
    //             bcrypt.compare(password, user.password, (err, result)=>{
    //                 if (err) return done(null, false)
    //                 if (result === true){
    //                     return done(null, user)
    //                 }
    //                 else {
    //                     return done(null, false)
    //                 }
    //             }) 
    //         })
    //     })
    // );
}