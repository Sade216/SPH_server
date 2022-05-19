const Mongoose = require('mongoose')
const commentsSchema = require('./commentsModel.js')

const reqString = {
    type: String,
    required: true,
}

const newsSchema = new Mongoose.Schema({
    author: reqString,
    title: {
        type: String,
        required: true,
    },
    text: reqString,
    picture: {
        type: String,
        default: 'none'
    },
    tags: [String],
    comments: [commentsSchema],
    likes: [String]
},
{
    timestamps: true
})

module.exports = Mongoose.model('news', newsSchema);