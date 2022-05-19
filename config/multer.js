const multer = require('multer')
const path = require('path')

//can make mp3 path etc...

const MulterImage = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb)=>{
        let ext = path.extname(file.originalname);
        if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png"){
            return cb(console.log('File type is not supported.'), false)
        }
        cb(null, true)
    }
})

const MulterTrack = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb)=>{
        // let ext = path.extname(file.originalname);
        // if(ext !== ".mp3" && ext !== ".wav"){
        //     return cb(console.log('File type is not supported.'), false)
        // }
        cb(null, true)
    }
})


module.exports = {MulterImage, MulterTrack}