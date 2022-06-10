const Mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true,
}

const commentsSchema = Mongoose.Schema({
    author: reqString,
    text: reqString,
    pinnedMusic: [],
    pinnedImages: [],
},
{
    timestamps: true
})

module.exports = commentsSchema