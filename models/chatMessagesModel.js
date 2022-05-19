const Mongoose = require('mongoose');

const ChatMessagesSchema = new Mongoose.Schema({
    from: Object,
    to: String,
    socketID: String,
    content: String,
},{
    timestamps: true
})
module.exports = Mongoose.model('Messages', ChatMessagesSchema);