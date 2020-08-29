import express from 'express';
import helmet from 'helmet';
import expressWs from 'express-ws';
import uploadRouter from './upload';
import config from './config';
import PddRead from './tampermonkey/pdd-read';
import cors from 'cors';
import { getJye } from './tampermonkey/sycm';
const { static_dir, upload_dir } = config;

function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (
                alias.family === 'IPv4' &&
                alias.address !== '127.0.0.1' &&
                !alias.internal
            ) {
                return alias.address;
            }
        }
    }
}

const { app, getWss } = expressWs(express());
app.use(helmet());
app.set('views', './views');
app.set('view engine', 'pug');
app.use('/static', express.static(static_dir));
app.use('/upload', express.static(upload_dir));
app.use(cors({ origin: 'http://linkcn.inc:8080', credentials: true }));
app.get('/', function(req, res, next) {
    res.render('index', {
        title: 'index'
    });
});
// /pdd?cat=6278
app.get('/pdd', function(req, res, next) {
    const query = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(query && query.cat){
        const cats = (query.cat as string).split(',');
        let result: any = [];
        cats.forEach((cat: any) => {
            result.push(PddRead(cat));
        });
        if (result.length === 1) result = result[0];
        res.json(result);
    }else{
        res.json([]);
    }}
);

// 读取交易额
app.get('/sycm', function(req, res, next) {
    const query = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(query && query.jyzs){
        const jszsArr = (query.jyzs as string).split(',').map(jszs => +jszs);
        if (jszsArr.length > 0) {
            getJye(jszsArr).then(jye => {
                res.json(jye);
            });
        } else {
            res.json([]);
        }
    }else{
        res.json([]);
    }
});

app.ws('/', function(ws, req) {
    // console.log(ws);
    ws.on('message', function(msg) {
        console.log(msg);
    });
    console.log('socket testing');
});

app.use('/upload', uploadRouter);
app.listen(3000, () => {
    console.log(`http://${getIPAddress()}:3000`);
    console.log('http://127.0.0.1:3000');
});
