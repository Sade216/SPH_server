const Mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true,
}

const musicSchema = new Mongoose.Schema({
    trackID: reqString,
    trackURL: reqString,
    author: reqString,
    title: reqString,
    description: {
        type: String,
    },
    imageID: {
        type: String,
    },
    imageURL: {
        type: String,
    },
    tags: [String],
    timesListened: [String],
},
{
    timestamps: true
})

module.exports = Mongoose.model('music', musicSchema);