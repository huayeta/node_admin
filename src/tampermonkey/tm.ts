import fse from 'fs-extra';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import xlsx from 'node-xlsx';
require('dotenv').config();

const {
    tm_product_id: product_id,
    tm_is_save_photo: is_save_photo,
    tm_select_length: select_length
} = process.env;
const productPath = path.join(__dirname, 'comments', `${product_id}`);
const commentPath = path.join(productPath, `comments.txt`);
const commentXlsx = path.join(productPath, 'comments.xlsx');
const photoPath = path.join(productPath, 'photos');

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
interface commentInt {
    append: null | { content: string; photos: photoInt[] };
    content: string;
    photos: photoInt[];
    rateId: number;
    video?: {
        cloudVideoUrl: string;
    };
}
interface resInt {
    maxPage: number;
    currentPageNum: number;
    comments: commentInt[];
}
const getData = (pageNum: number = 1) => {
    return axios.get<resInt>('https://rate.taobao.com/feedRateList.htm', {
        params: {
            auctionNumId: product_id,
            userNumId: 2978418630,
            currentPageNum: pageNum,
            pageSize: 20,
            orderType: 'feedbackdate',
            callback: 'jsonp_tbcrate_reviews_list'
        },
        headers: {
            cookie:
                't=c96666575095447191ef1a4e1935630d; thw=cn; ali_ab=123.160.227.19.1547462868468.6; cookie2=1b8edb30cc3e71607b16a9ec7008648b; _utk=VocP@qJyn^AtWdm; ctoken=cBUcCaKmn77zj2LZU5mvrhllor; x=2343541658%3D%26e%3D1%26p%3D*%26s%3D0%26c%3D0%26f%3D0%26g%3D0%26t%3D0%26__ll%3D-1%26_ato%3D0; whl=-1%260%260%261570697140223; _samesite_flag_=true; _fbp=fb.1.1585127579257.1510456341; _bl_uid=94kmp887sCs61a2ejiO3nt66vz0k; linezing_session=xX7rFQqIIgnIj5aFZM46hot5_1587889248782eQQ2_6; _tb_token_=UFErkMuamnlcK1; UM_distinctid=1734c714403701-087a044145d82a-31627405-13c680-1734c714404546; _m_h5_tk=e9b72f09c700d1883c27ec7d26c903c0_1596185392307; _m_h5_tk_enc=0cdfe538ae12986d1fdb1b7882b2b2d7; sgcookie=ExiYaKbKKLXEMJi3%2BPZRl; unb=2207831172436; sn=%E4%B8%87%E9%98%81%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E4%B8%93%E8%90%A5%E5%BA%97%3A%E6%9C%B1; csg=21e3038f; skt=9bced9f9078f6c28; _cc_=Vq8l%2BKCLiw%3D%3D; tfstk=cAaPBsN8322bOl3CX4gePrjtXbHRZ3UgJKlIqlKJkDi11DiliM9KiMHS0cMOo0f..; cna=0KagFOaAPigCAXug4FS/jgtp; uc1=cookie14=UoTV6hrGoxr8mg%3D%3D&cookie21=VFC%2FuZ9aj3yE; enc=nS1tZBrzo1tUHwj1yvtnk8UuUWT3WK3ob00mwhlJ%2BD8w%2FZoV30Sfv6KeJyZbll7kzoLccZejMcRSY96BLR%2BB8dgzuteOZRyYl2HMPYuQl6Y%3D; hng=CN%7Czh-CN%7CCNY%7C156; v=0; mt=ci%3D-1_1; l=eBL_N3bgOEkn6HB8BO5Zlurza779zIOfCsPzaNbMiInca61PMhcRvNQqmU1WydtjgtfvIety9vVkARUv84z_8ETjGO0qOC0eQl96-; isg=BJOTy3rsyJkHBITwdagfq7KCIhG9SCcKUA9f9EWxu7LDxLZmzRk4WKFS_jSq5H8C',
            referer:
                'https://item.taobao.com/item.htm?spm=a230r.1.14.703.1bac4f249d4Js3&id=619699134009&ns=1&abbucket=18'
        },
        transformResponse: [
            data => {
                const match = data.match(/jsonp_tbcrate_reviews_list\((.+)\)/);
                if (match) {
                    return JSON.parse(match[1]);
                }
                return data;
            }
        ]
    });
};
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
            const ws = fs.createWriteStream(
                path.join(photoPath, name ? `${name}.${min}` : url)
            );
            ws.on('finish', () => {
                resolve();
            });
            res.data.pipe(ws);
        });
    } catch (e) {
        console.log(e);
    }
};
// saveImg('//img.alicdn.com/imgextra/i2/0/O1CN01955acY1Z553MRFwKd_!!0-rate.jpg_400x400.jpg','3');
const saveVideo = async (url: string, name?: string) => {
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
            const ws = fs.createWriteStream(
                path.join(photoPath, name ? `${name}.${min}` : url)
            );
            ws.on('finish', () => {
                resolve();
            });
            res.data.pipe(ws);
        });
    } catch (e) {
        console.log(e);
    }
};
// saveVideo('//cloud.video.taobao.com/play/u/4e666f412b694a5254754e74686a444e6245722b7a673d3d/p/1/d/sd/e/6/t/1/274479061823.mp4')
class Str {
    _content: string;
    _photo: photoInt[];
    _video: videoInt[];
    _content_xlsx: { name: string; data: any[][] }[];
    constructor() {
        this._content = '';
        this._photo = [];
        this._video = [];
        this._content_xlsx = xlsx.parse(commentXlsx);
    }
    add(str: string, fir?: string) {
        if (
            str &&
            !str.includes('此用户没有填写评价') &&
            !str.includes('系统默认好评') &&
            str.length >= +select_length!
        ) {
            this._content += `${this._content && '\r\n'}${fir}${str}`;
            this._content_xlsx[0].data.push([fir + str]);
        }
    }
    addPhoto(images: photoInt[] = []) {
        this._photo = this._photo.concat(images);
    }
    addVideo(video: videoInt) {
        this._video.push(video);
    }
    async save() {
        await fse.appendFile(commentPath, this._content);
        if (is_save_photo) {
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
const Start = async (pageNum: number = 1) => {
    console.log(`第${pageNum}页：正在获取的评语...`);
    const res = await getData(pageNum);
    const result = res.data;
    const { maxPage, currentPageNum, comments } = result;
    const STR = new Str();
    comments.forEach(comment => {
        let fir = '';
        if (comment.photos && comment.photos.length > 0) {
            fir = `有图片：${comment.photos[0].receiveId}，`;
        }
        STR.add(comment.content, fir);
        STR.addPhoto(comment.photos);
        if (comment.video)
            STR.addVideo({
                receiveId: comment.rateId,
                url: comment.video.cloudVideoUrl
            });
        if (comment.append) {
            let fir = '';
            if (comment.append.photos && comment.append.photos.length > 0) {
                fir = `有图片：${comment.append.photos[0].receiveId}，`;
            }
            STR.add(comment.append.content, fir);
            STR.addPhoto(comment.append.photos);
        }
    });
    console.log(
        `第${pageNum}页/${maxPage}页：得到${comments.length}个评语，正在保存...`
    );
    await STR.save();
    console.log(`第${pageNum}页/${maxPage}页：保存成功`);
    console.log('-----------------------------');
    if (currentPageNum < maxPage) {
        const nextPageNum = currentPageNum + 1;
        await Start(nextPageNum);
        return;
    }
};
const Task = async () => {
    const is_exit = await fse.pathExists(productPath);
    if (is_exit) {
        return Promise.reject('目录存在');
    }
    // 确保商品目录存在
    await fse.ensureDir(productPath);
    // 确保商品图片目录存在
    is_save_photo && (await fse.ensureDir(photoPath));
    // 清空评论
    await fse.outputFile(commentPath, '');
    // 确保comments.xlsx存在
    const buffer = xlsx.build([{ name: `${product_id}`, data: [] }]);
    await fse.writeFile(commentXlsx, buffer, 'binary');
    // 开始收集评论
    await Start();
};
Task()
    .then(() => {
        console.log(`全部保存完成，保存在：${productPath}`);
    })
    .catch(reason => {
        console.log(reason);
    });
