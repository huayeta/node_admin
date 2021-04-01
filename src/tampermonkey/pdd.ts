// 评论收集

import fse from 'fs-extra';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import xlsx from 'node-xlsx';
require('dotenv').config();

const {
    pdd_goods_id : product_id,
    pdd_is_save_photo : is_save_photo,
    pdd_select_length: select_length = '0',
    pdd_select_qz : select_qz = '0',
    pdd_end = '*'
} = process.env;
const productPath = path.join(__dirname, 'pdd_comments', product_id!);
const commentPath = path.join(
    productPath,
    pdd_end === '*' ? 'comments.txt' : `comments-${pdd_end!.slice(0, 10)}.txt`
);
const commentXlsx = path.join(
    productPath,
    pdd_end === '*' ? 'comments.xlsx' : `comments-${pdd_end!.slice(0, 10)}.xlsx`
);
const photoPath = path.join(productPath, 'photos');

if (typeof product_id === 'undefined') {
    console.log(`tm_product_id 未定义;`);
    process.exit();
}
if (typeof is_save_photo === 'undefined') {
    console.log(`tm_is_save_photo 未定义;`);
    process.exit();
}
if (typeof select_length === 'undefined') {
    console.log(`tm_select_length 未定义;`);
    process.exit();
}
if (typeof pdd_end === 'undefined') {
    console.log(`tm_end 未定义;`);
    process.exit();
}

interface photoInt {
    url: string;
    review_id: number;
}
interface videoInt {
    review_id: number;
    url: string;
}
interface commentVideoInt {
    url: string;
    review_id: number;
}
interface commentInt {
    append: null | {
        comment: string;
        pictures: photoInt[];
        video?: commentVideoInt;
    };
    comment: string;
    pictures: photoInt[];
    review_id: number;
    time: number;
    video?: commentVideoInt;
}

interface resInt {
    data: commentInt[];
}
const getData = (pageNum: number = 1) => {
    return axios.get<resInt>(
        `https://mobile.yangkeduo.com/proxy/api/reviews/${product_id}/list?pdduid=0&page=1&size=20&enable_video=1&enable_group_review=1&label_id=700000000`,
        {
            params: {
                page: pageNum,
                size: 20,
            },
            headers: {
                accesstoken: "UTLLO67NCXD4UTOFNMUCRXNF5NSIX6TYVDH2QDA4O7A3HJCMXK3Q1133109",
                cookie:
                    'api_uid=CiH5i12sGkdSbgA/ln7gAg==; _nano_fp=Xpd8XpdjX09oX0EJnC_pdrcq1tdx8PmtrOljvgu9; Hm_lvt_1370d93b7ce0e6f1d870cef43042d966=1607532972; Hm_lpvt_1370d93b7ce0e6f1d870cef43042d966=1607533435; ua=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F89.0.4389.82%20Safari%2F537.36; webp=1; JSESSIONID=301CB4E3F5E76F786AB25C9EAEEC1300; PDDAccessToken=UTLLO67NCXD4UTOFNMUCRXNF5NSIX6TYVDH2QDA4O7A3HJCMXK3Q1133109; pdd_user_id=3763110705; pdd_user_uin=QBX7GBOEDJEBO4R3B6WF7KOXGM_GEXDA; pdd_vds=gaTdBNsxnlxbBwdOxbGmBOedGyxsLbIGIsNGBGsIGyBmInbndEINGbudnEmN',
                referer:
                    'https://item.taobao.com/item.htm?spm=a230r.1.14.703.1bac4f249d4Js3&id=619699134009&ns=1&abbucket=18',
                'user-agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.${pageNum}.82 Safari/537.36`
            },
            transformResponse: [
                data => {
                    return JSON.parse(data);
                }
            ]
        }
    );
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
// saveImg(
//     '//img.alicdn.com/bao/uploaded/i3/O1CN01rduj7n1bITuXmtUmH_!!0-rate.jpg',
//     '3'
// )
//     .then(res => {
//         console.log(res);
//     })
//     .catch(res => {
//         console.log(res);
//     });
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
// saveVideo('//cloud.video.taobao.com/play/u/4e666f412b694a5254754e74686a444e6245722b7a673d3d/p/1/d/sd/e/6/t/1/274479061823.mp4')
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
        if (
            ((str &&
                !str.includes('此用户没有填写评价') &&
                !str.includes('系统默认好评') &&
                str.length >= +select_length!)) ||
            fir
        ) {
            if(select_qz === '1' && str.length < +select_length!)return;
            if (pdd_end !== '*' && str.includes(pdd_end)) {
                this._end = true;
            }
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
                    str.includes(pdd_end)
                );
                if (index !== -1)
                    this._content = this._content.slice(0, index + 1);

                const xlsx_index = this._content_xlsx[0].data.findIndex(arr =>
                    arr[0].includes(pdd_end)
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
            return saveImg(img.url, `${img.review_id}_${index}`);
        });
        await Promise.all(this._photo);
    }
    async saveVideos() {
        this._video.map(video => {
            return saveVideo(video.url, `${video.review_id}`);
        });
        await Promise.all(this._video);
    }
    async saveXlsx() {
        const buffer = xlsx.build(this._content_xlsx);
        await fse.writeFile(commentXlsx, buffer, 'binary');
    }
}
const getComments = async (pageNum: number, needFold: string = '0') => {
    const tmData = await getData(pageNum);
    const rateList = tmData.data;
    const comments = [] as commentInt[];
    if (!rateList) return {data:[]} as resInt;
    const time = Date.now();
    rateList.data.forEach(comment => {
        comments.push({
            pictures: comment.pictures.map(pic => {
                return {
                    review_id: time,
                    url: pic.url
                };
            }),
            comment: comment.comment,
            review_id: comment.review_id,
            video:comment.video,
            time: time,
            append: comment.append
                ? {
                    comment: comment.append.comment,
                    pictures: comment.append.pictures.map(pic => {
                        return {
                            review_id: time,
                            url: pic.url
                        };
                    })
                }
                : null
        });
    });
    return {
        data: comments
    } as resInt;
};
// getComments(1,'1').then(res=>{
//     console.log(res.comments);
// })
let MAXPAGE: number = 0;
function sleep (time:number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
const Start = async (pageNum: number = 1, needFold: string = '0') => {
    console.log(`第${pageNum}页：正在获取的评语...`);
    const result = await getComments(pageNum, needFold);
    const { data } = result
    const STR = new Str(pageNum);
    console.log(data)
    if (data && data.length) {
        // if(needFold === '1')console.log(comments);
        data.forEach(comment => {
            let fir = '';
            if (comment.pictures && comment.pictures.length > 0) {
                fir = `有图片：${comment.pictures[0].review_id}，`;
            }
            STR.add(comment.comment, fir);
            // console.log(comment.photos)
            STR.addPhoto(comment.pictures);
            if (comment.video && comment.video.url)
                // console.log(comment.video.cloudVideoUrl);
                STR.addVideo({
                    review_id: comment.review_id,
                    url: comment.video.url
                });
            if (comment.append) {
                let fir = '';
                if (comment.append.pictures && comment.append.pictures.length > 0) {
                    fir = `有图片：${comment.append.pictures[0].review_id}，`;
                }
                STR.add(comment.append.comment, fir);
                STR.addPhoto(comment.append.pictures);
                if (
                    comment.append.video &&
                    comment.append.video.url
                ) {
                    STR.addVideo({
                        review_id: comment.review_id,
                        url: comment.append.video.url
                    });
                }
            }
        });
        console.log(
            `第${pageNum}页：得到${data.length}个评语，正在保存...`
        );
        // if(needFold === '1')console.log(STR);
        await STR.save(pageNum === 1 && needFold === '1' ? true : false);
        console.log(`第${pageNum}页：保存成功`);
    } else {
        console.log(`第${pageNum}页：保存失败，跳过`);
    }
    console.log('-----------------------------');
    if (STR._end) return;
    if (data && data.length>0) {
        const nextPageNum = pageNum + 1;
        await sleep(1000);
        await Start(nextPageNum);
        return;
    }
};
// Start(1, '1');
const Task = async () => {
    const is_exit = await fse.pathExists(productPath);
    if (is_exit && pdd_end === '*') {
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
    await Start(1);
};
Task()
    .then(() => {
        console.log(`全部保存完成，保存在：${productPath}`);
    })
    .catch(reason => {
        console.log(reason);
    });