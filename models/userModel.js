const Mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true,
}

const postsSchema = Mongoose.Schema({
    author: reqString,
    text: reqString,
},
{
    timestamps: true
})

const userSchema = new Mongoose.Schema({
    nickname: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    about: {
        type: String,
        default: '',
    },
    password: reqString,
    trackList: [String],
    pref_genres: [String],
    visitors: [String],
    followers: [String],
    youFollow: [String],
    role: {
        type: String,
        default: 'member',
        enum: ['member', 'editor', 'admin', 'owner']
    },
    avatarURL: {
        type: String,
        default: 'none'
    },
    avatarID: {
        type: String,
        default: 'none'
    },
    backgoundURL: {
        type: String,
        default: 'none'
    },
    backgoundID: {
        type: String,
        default: 'none'
    },
    lastLogin: Date,
    posts: [postsSchema],
},
{
    timestamps: true
})

module.exports = Mongoose.model('user', userSchema);

