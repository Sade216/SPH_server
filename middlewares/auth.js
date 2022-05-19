const Mongoose = require('mongoose')
const User = require('../models/userModel.js')

const isRole = role => (req, res, next) => {
    if(!role.includes(req.user?.role)){
        res.send('Not enought rights') 
    } 
    else{
        next()
    }
}
async function updateData(user) {
    if(user){
        const newUser = User.findOne({_id: user._id}, async (err, doc)=>{
            if(err) throw err;
            if(!doc) console.log('Пользователь не найден')
            if(doc){
                doc.lastLogin = new Date
                await doc.save()
            }
        })
    }
    else res.send('error')
}

module.exports = {isRole, updateData}