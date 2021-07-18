// 评论收集

import fse from 'fs-extra';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import xlsx from 'node-xlsx';
require('dotenv').config();

interface photoInt {
    fileId: number;
    receiveId: number;
    thumbnail: string;
    url: string;
}
interface videoInt {
    receiveId: number;
    url: string;
}
interface commentVideoInt {
    cloudVideoUrl: string;
}
interface commentInt {
    append: null | {
        content: string;
        photos: photoInt[];
        video?: commentVideoInt;
    };
    content: string;
    photos: photoInt[];
    rateId: number;
    video?: commentVideoInt;
}

interface commentTmInt {
    rateContent: string;
    id: number;
    pics: string[];
    videoList: commentVideoInt[];
    appendComment: null | {
        content: string;
        pics: string[];
        videoList: commentVideoInt[];
    };
}
interface resInt {
    maxPage: number;
    currentPageNum: number;
    comments: commentInt[];
}
interface resIntTm {
    rateDetail: {
        paginator: {
            lastPage: number;
            page: number;
            items: number;
        };
        rateList: commentTmInt[];
    };
}

const {
    pdd_goods_id: product_id,
    pdd_select_length: select_length = '0',
    pdd_end: tm_end = '*',
    pdd_is_save_photo: is_save_photo,
} = process.env;

const productPath = path.join(__dirname, 'pdd_comments', product_id!);
const photoPath = path.join(productPath, 'photos');
const commentPath = path.join(
    productPath,
    tm_end === '*' ? 'comments.txt' : `comments-${tm_end!.slice(0, 10)}.txt`
);
const commentXlsx_r = path.join(
    __dirname,`pdd-zzb-comment.xlsx`
);
const commentXlsx = path.join(
    productPath,
    tm_end === '*' ? 'comments.xlsx' : `comments-${tm_end!.slice(0, 10)}.xlsx`
);

const saveImg = async (url: string, name?: string) => {
    if (url.startsWith('//')) url = 'https:' + url;

    const match = url.match(/^(.+?)_\d+x\d+\.\w+$/);
    if (match) url = match[1];

    let min = 'jpg';
    const match_min = url.match(/\/([^\/]+?)\.(\w+?)$/);
    if (match_min) {
        name = name || match_min[1];
        min = match_min[2];
    }
    try {
        const res = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });
        return new Promise((resolve, reject) => {
            const wr_url = path.join(photoPath, name ? `${name}.${min}` : url);
            const ws = fs.createWriteStream(wr_url);
            ws.on('finish', () => {
                resolve(wr_url);
            });
            ws.on('error', () => {
                console.log(`error:${wr_url}`);
            });
            res.data.pipe(ws);
        });
    } catch (e) {
        console.log(e);
    }
};

const saveVideo = async (url: string, name?: string) => {
    if (!url) return Promise.resolve();
    if (url.startsWith('//')) url = 'https:' + url;

    let min = 'mp4';
    const match_min = url.match(/\/([^\/]+?)\.(\w+?)$/);
    if (match_min) {
        name = name || match_min[1];
        min = match_min[2];
    }

    try {
        const res = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });
        return new Promise((resolve, reject) => {
            const wr_url = path.join(photoPath, name ? `${name}.${min}` : url);
            const ws = fs.createWriteStream(wr_url);
            ws.on('finish', () => {
                resolve(wr_url);
            });
            ws.on('error', () => {
                console.log(`error:${wr_url}`);
            });
            res.data.pipe(ws);
        });
    } catch (e) {
        console.log(e);
    }
};

class Str {
    _content: string[];
    _photo: photoInt[];
    _video: videoInt[];
    _content_xlsx: { name: string; data: any[][] }[];
    _pageNum: number;
    _end: boolean;
    constructor(pageNum: number = 1) {
        this._pageNum = pageNum;
        this._content = [];
        this._photo = [];
        this._video = [];
        this._content_xlsx = xlsx.parse(commentXlsx);
        this._end = false;
    }
    add(str: string, fir?: string) {
        if(!fir) fir = '';
        if (
            ((str &&
                !str.includes('该用户觉得商品很好，给出了5星好评') &&
                !str.includes('系统默认好评') &&
                str.length >= +select_length!)) ||
            fir
        ) {
            // console.log(str)
            this._content.push(`${fir}${str}`);
            this._content_xlsx[0].data.push([fir + str]);
        }
    }
    addPhoto(images: photoInt[] = []) {
        this._photo = this._photo.concat(images);
    }
    addVideo(video: videoInt) {
        this._video.push(video);
    }
    async save(fir: boolean = false) {
        // console.log(this._pageNum,typeof this._pageNum,this._pageNum !== 1,this._pageNum !== 1 ? '12\r\n' : '');
        if (this._content.length > 0) {
            if (this._end) {
                const index = this._content.findIndex(str =>
                    str.includes(tm_end)
                );
                if (index !== -1)
                    this._content = this._content.slice(0, index + 1);

                const xlsx_index = this._content_xlsx[0].data.findIndex(arr =>
                    arr[0].includes(tm_end)
                );
                if (xlsx_index !== -1)
                    this._content_xlsx[0].data = this._content_xlsx[0].data.slice(
                        0,
                        xlsx_index + 1
                    );
            }
            const content =
                `${this._pageNum !== 1 || fir ? '\r\n' : ''}` +
                this._content.join('\r\n');
            await fse.appendFile(commentPath, content);
        }
        if (is_save_photo === '1') {
            await this.savePhotos();
            await this.saveVideos();
        }
        await this.saveXlsx();
    }
    async savePhotos() {
        this._photo.map((img, index) => {
            return saveImg(img.url, `${img.receiveId}_${index}`);
        });
        await Promise.all(this._photo);
    }
    async saveVideos() {
        this._video.map(video => {
            return saveVideo(video.url, `${video.receiveId}`);
        });
        await Promise.all(this._video);
    }
    async saveXlsx() {
        const buffer = xlsx.build(this._content_xlsx);
        await fse.writeFile(commentXlsx, buffer, 'binary');
    }
}

const Task = async () => {
    const is_exit = await fse.pathExists(productPath);
    if (is_exit && tm_end === '*') {
        return Promise.reject(`${productPath} 目录存在`);
    }
    // 确保商品目录存在
    await fse.ensureDir(productPath);
    // 确保商品图片目录存在
    is_save_photo === '1' && (await fse.ensureDir(photoPath));
    // 清空评论
    await fse.outputFile(commentPath, '');
    // 确保comments.xlsx存在
    const buffer = xlsx.build([{ name: `${product_id}`, data: [] }]);
    await fse.writeFile(commentXlsx, buffer, 'binary');
    // 开始收集评论
    const Data = xlsx.parse(commentXlsx_r)[0].data.slice(0);
    const str = new Str();
    Data.forEach((data,index)=>{
        str.add(data[1]?`有图片：${index},${data[0]}`:data[0] as any);
        let photos: any = data[1]?(data[1] as any).split(','):[];
        photos = photos.map((photo:any)=>{
            return {
                fileId: index,
                receiveId: index,
                thumbnail: photo,
                url: photo,
            }
        })
        str.addPhoto(photos);
        let videos:any = data[2]?{receiveId: index,url: data[2]}:'';
        if(videos) str.addVideo(videos);
    })
    await str.save();
};
Task()
    .then(() => {
        console.log(`全部保存完成，保存在：${productPath}`);
    })
    .catch(reason => {
        console.log(reason);
    });
