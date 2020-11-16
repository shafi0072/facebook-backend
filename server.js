import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import GridFsStorage from 'multer-gridfs-storage';
import Grid from 'gridfs-stream';
import bodyParser from 'body-parser';
import path, { resolve } from 'path';
import Pusher from 'pusher';
import { promises } from 'fs';
import { rejects } from 'assert';

import mongoPosts from './postModel.js';

Grid.mongo = mongoose.mongo;

// app config
const app = express();
const port = process.env.PORT || 9000;

// middlewares
app.use(bodyParser.json());
app.use(cors());

// db config

const mongoURL = `mongodb+srv://fb-client:xtu3miXr5GJpSXH@cluster0.spccg.mongodb.net/facebook-db?retryWrites=true&w=majority`

const conn = mongoose.createConnection(mongoURL,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});
let gfs;

conn.once('open', () => {
    console.log('DB Connected')

    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('image')
})

const storage = new GridFsStorage({
    url: mongoURL,
    file:(req, file) => {
        return new promise((resolve, reject) => {
            const filename = `image-${Date.now()}${path.extname(file.originalname)}`

            const fileInfo = {
                filename: filename,
                bucketName:'image'
            };
            resolve(fileInfo);
        });
    }
})
const upload = multer({storage});

mongoose.connect(mongoURL,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// api routes
app.get('/',(req, res) => res.status(200).send('Hello World'));
app.post('/api/upload/image', upload.single('file'),(req, res) => {
    res.status(201).send(req.file)
});

app.post('/upload/post', (req, res) => {
    const dbPost = req.body
    

    mongoPosts.create(dbPost, (err, data) => {
        if(err){
            res.status(500).send(err)

        }else{
            res.status(201).send(data)
        }
    })
})

app.get('/retrieve/posts', (req, res) => {
    mongoPosts.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            data.sort((b, a) => {
                return a.timestamp - b.timestamp;
            })
            res.status(200).send(data)
        }
    })
})
app.get('/retrive/image/single', (req, res) => {
    gfs.files.findOne({filename: req.query.name}, (err, file) => {
        if(err){
            res.status(500).send(err)
        }else{
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }
    })
})

// listen
app.listen(port, () => console.log('its working'));
