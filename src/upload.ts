import express from 'express';
import fse from 'fs-extra';
import Busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import os from 'os';
import nanoid from 'nanoid';
import { extractExt, judgeParams, mergeFileChunk } from './util';
import config from './config';
const { upload_dir } = config;
const uploadRouter = express.Router();

fse.ensureDirSync(upload_dir);
interface IFile {
    chunk?: NodeJS.ReadableStream;
    hash?: string;
    fileHash?: string;
    [propName: string]: any;
}
// 上传切片
uploadRouter.post('/file', (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    const FILE: IFile = {};
    const ID = nanoid();
    const saveTo = path.join(os.tmpdir(), ID);
    busboy.on('file', function(fieldName, file, filename, encoding, mimetype) {
        if (fieldName === 'chunk') FILE.chunk = file;
        // console.log(fieldname, filename, file);
        // console.log(mimetype);
        file.pipe(fs.createWriteStream(saveTo));
    });
    busboy.on('field', function(
        fieldName,
        val,
        fieldnameTruncated,
        valTruncated
    ) {
        FILE[fieldName] = val as string;
    });
    busboy.on('finish', function() {
        const judgeResults = judgeParams(['hash', 'chunk', 'fileHash'], FILE);
        if (judgeResults.length != 0)
            return res.json({ code: -1, message: 'error', data: judgeResults });
        const dest = path.join(
            upload_dir,
            './caches',
            path.basename(FILE.fileHash!),
            FILE.hash!
        );
        try {
            fs.accessSync(dest, fs.constants.F_OK);
        } catch (e) {
            fse.moveSync(saveTo, dest);
        }
        res.json({
            code: 0,
            msg: 'success'
        });
    });
    req.pipe(busboy);
});
//合并切片
uploadRouter.post('/merge', (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    const fields: {
        fileHash?: string;
        exit?: string;
        [propName: string]: any;
    } = {};
    busboy.on('field', function(fieldName, val) {
        fields[fieldName] = val;
    });
    busboy.on('finish', function() {
        const { fileHash, exit } = fields;
        const judgeResults = judgeParams(['fileHash', 'exit'], fields);
        if (judgeResults.length > 0)
            return res.json({ code: -1, data: judgeResults, message: 'error' });
        mergeFileChunk({ fileHash: fileHash!, exit: exit! }).then(() => {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    url: `/static/uploads/${fileHash}.${exit}`,
                    fileHash
                }
            });
        });
    });
    req.pipe(busboy);
});
//验证文件是否已经上传
uploadRouter.post('/verify', (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    const fields: {
        fileName?: string;
        fileHash?: string;
        [propName: string]: any;
    } = {};
    busboy.on('field', function(fieldName, val) {
        fields[fieldName] = val;
    });
    busboy.on('finish', function() {
        const { fileName, fileHash } = fields;
        const judgeResults = judgeParams(['fileName', 'fileHash'], fields);
        if (judgeResults.length > 0)
            return res.json({ code: -1, data: judgeResults, message: 'error' });
        const exit = extractExt(fileName!);
        const filePath = path.join(upload_dir, `${fileHash}.${exit}`);
        fs.access(filePath, fs.constants.F_OK, async err => {
            if (!err)
                return res.json({
                    code: 0,
                    message: '存在',
                    data: {
                        url: `/static/uploads/${fileHash}.${exit}`,
                        fileHash
                    }
                });
            const chunkPaths = path.join(
                upload_dir,
                './caches',
                `./${fileHash}`
            );
            const is_exit_chunk_path = await fse.pathExists(chunkPaths);
            if (!is_exit_chunk_path)
                return res.json({ code: -1, message: '不存在' });
            const chunks = await fse.readdir(chunkPaths);
            return res.json({
                code: 1,
                message: '存在切片',
                data: chunks
            });
        });
    });
    req.pipe(busboy);
});

export default uploadRouter;
