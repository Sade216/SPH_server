const session = require('express-session');
const Mongoose = require('mongoose');
const cors = require('cors');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

require('dotenv').config();
const passport = require('passport');

const userRouter = require('./routes/userRouter.js');
const newsRouter = require('./routes/newsRouter.js');
const musicRouter = require('./routes/musicRouter.js');

const User = require('./models/userModel.js')
const Message = require('./models/chatMessagesModel.js')


var sessionMiddleware = session({
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
});


Mongoose.connect(process.env.MONGO_DB_CONNECT_KEY).then(
    () => {console.log('Mongo DB succesfully started.')}
    ,err => {console.log(err)}
);

require('./config/passportConfig')(passport);

const PORT = process.env.PORT || 5000;

var user

const app = require('express')()
    .use(sessionMiddleware)
    .use(passport.initialize())
    .use(passport.session({
        secret: process.env.COOKIE_SECRET,
        resave: true,
        saveUninitialized: true,
    }))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: true}))
    .use(cors({
        origin: true,
        // origin: process.env.CLIENT_URL,
        credentials: true
    }))
    .use(cookieParser(process.env.COOKIE_SECRET))

    .use('/api/user', userRouter)
    .use('/api/news', newsRouter)
    .use('/api/music', musicRouter)

    .use('/api/chat/', async(req, res)=>{
        res.send(rooms)
    })

    .listen(PORT, ()=>{
        console.log('Server Has Started on PORT ' + PORT)
    })


//Chat


let rooms = ['general']

var io = require('socket.io')(app, {
    cors: {
        origin: true,
        // origin: process.env.CLIENT_URL,
        credentials: true
    }
})

// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session({
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
})));
io.use((socket, next) => {
    next()
});

//functions socketIO

async function getRoomMessages(room){
    let roomMessages = await Message.aggregate([
        {$match: {to: room}},
    ])
    return roomMessages
}

io.on('connect', (socket) => {
    const session = socket.request.session;
    session.socketId = socket.id;
    session.save();
    //user stats
    socket.on('new-user', async() => {
        const members = await User.find({})
        socket.emit('new-user' , members)
    });
    
    //rooms
    socket.on('join-room', async(room)=>{
        socket.join(room)
        let roomMessages = await getRoomMessages(room)
        socket.emit('room-messages', roomMessages)
    })
    
    socket.on('message-room', async(room, content, sender)=>{
        const newMessage = await Message.create({content, from: sender, to:room})
        let roomMessages = await getRoomMessages(room)
        io.to(room).emit('room-messages', roomMessages)

        socket.broadcast.emit('notifications', room)
    })

    //utils
    socket.on('whoami', socket =>{
        socket.emit('whoami', socket.request.user)
    })

    
});