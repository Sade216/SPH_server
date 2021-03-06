const Mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true,
}

const postsSchema = Mongoose.Schema({
    text: reqString,
    likes: [String],
    pinnedMusic: [],
    pinnedImages: [],
},
{
    timestamps: true
})

const Post = Mongoose.model('posts', postsSchema)
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
    password: reqString,
    about: {
        type: String,
        default: null,
    },
    trackList: [String],
    featuredList: [String],
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
        default: null
    },
    avatarID: {
        type: String,
        default: null
    },
    backgoundURL: {
        type: String,
        default: null
    },
    backgoundID: {
        type: String,
        default: null
    },
    lastLogin: Date,
    posts: [postsSchema],
},
{
    timestamps: true
})
const User = Mongoose.model('user', userSchema)
module.exports = {Post, User};

