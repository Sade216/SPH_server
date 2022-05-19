const Mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true,
}

const commentsSchema = Mongoose.Schema({
    author: reqString,
    text: reqString,
    picture: {
        type: String,
        default: 'none'
    }
},
{
    timestamps: true
})

module.exports = commentsSchema