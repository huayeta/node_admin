// 评论收集

import fse from 'fs-extra';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import xlsx from 'node-xlsx';
require('dotenv').config();

const {
    tm_product_id: product_id,
    tm_is_save_photo: is_save_photo,
    tm_select_length: select_length = '0',
    tm_select_qz : select_qz = '0',
    tm_is = '0',
    tm_end = '*',
    tm_fold = '0'
} = process.env;
const productPath = path.join(__dirname, 'comments', product_id!);
const commentPath = path.join(
    productPath,
    tm_end === '*' ? 'comments.txt' : `comments-${tm_end!.slice(0, 10)}.txt`
);
const commentXlsx = path.join(
    productPath,
    tm_end === '*' ? 'comments.xlsx' : `comments-${tm_end!.slice(0, 10)}.xlsx`
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
if (typeof tm_end === 'undefined') {
    console.log(`tm_end 未定义;`);
    process.exit();
}

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
const getData = (pageNum: number = 1, folded: string = '0') => {
    return axios.get<resInt>(
        'https://rate.taobao.com/feedRateList.htm?auctionNumId=626989843655&userNumId=2343541658&currentPageNum=1&pageSize=20&rateType=&orderType=feedbackdate&attribute=&sku=&hasSku=false&folded=0&ua=098%23E1hvj9vWvRyvUvCkvvvvvjiWP2SwAjtbn2qh1jivPmPp6jn8RssWsj3URszhAjtjdvhvmpvCytoLvvmHwQvCvvOv9hCvvvmgvpvIvvCvpvvvvvvvvhNjvvmClvvvBGwvvvUwvvCj1Qvvv99vvhNjvvvmm89Cvv9vvhhzL4N2Fg9CvvOCvhE2gnQUvpCWv8Vs%2B1zEn1mAdc9DYE7rj8TxO3NniLwBHdBYLWsOjEy7RAYVyOvO5fVQWl4vAC9aRfU6pwethb8r5C60dbm65i9OwZRQ0fJ6W3CQoQgCvvpvvPMMRvhvCvvvphmevpvhvvCCBUOCvvpv9hCv9vhvHnMSndQY7rMNzskRMHQbtlPNVas3RvhvCvvvphv%3D&_ksTS=1607725653379_1495&callback=jsonp_tbcrate_reviews_list',
        {
            params: {
                auctionNumId: product_id,
                userNumId: 2978418630,
                currentPageNum: pageNum,
                pageSize: 20,
                folded: '0',
                orderType: 'feedbackdate',
                callback: 'jsonp_tbcrate_reviews_list'
            },
            headers: {
                cookie:
                    'cookie2=1e5ff2ed7165f5bb548f09b9f8fe9959; s=VW8f3hxM; t=00db5613b4729ef18186d0179f2bd45e; cna=/SEgFrkPTB8CAT00oyJzMqVG; UM_distinctid=173f1ac4e6c20e-0517fa470c9ebf-3323767-1fa400-173f1ac4e6dc99; login=true; dnk=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; uc3=vt3=F8dCufeBx4sMUOiHJ8U%3D&nk2=saDOo3ihwnk%3D&id2=UUphzOVxh0qcKbPFUg%3D%3D&lg2=VT5L2FSpMGV7TQ%3D%3D; tracknick=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; uc4=nk4=0%40s8WOEy%2B5Iw8R3mF2Pn0cU4a6dA%3D%3D&id4=0%40U2grF86%2BBspCia2nYzCNm8yC8th3j03D; lgc=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; hng=CN%7Czh-CN%7CCNY%7C156; tk_trace=1; sm4=410100; sgcookie=E100TuSODrDkeMgHzTXDuNBKIhnf6QwCoEJW0UW1VBylIBmiPWHfKEP8fftJhUnoIz7urkQMR%2FynzRTPJocQtrmbHg%3D%3D; lid=%E4%B8%87%E9%98%81%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E4%B8%93%E8%90%A5%E5%BA%97%3A%E6%9C%B1; enc=D6q0mlt9zj2lhfYJ0sDrjs8seIBkABvZtkuusobfWTnmo9t2GYhy5JLpgwK2O27WAqocvBfgs8Dy3mJIyjk2nWehkLwEo7Brvj%2Fd3vlo038%3D; Hm_lvt_96bc309cbb9c6a6b838dd38a00162b96=1604681033; _tb_token_=671803307e8b; uc1=cookie14=Uoe0aDvdmaakcg%3D%3D&cookie21=UIHiLt3xSalX; csg=fd46cd2e; xlly_s=1; _m_h5_tk=48c9b67b8ba87c9d94425a8f525ab161_1605807036055; _m_h5_tk_enc=8062d11d7b881f8ac831b6d027da701d; Hm_lpvt_96bc309cbb9c6a6b838dd38a00162b96=1605798223; tfstk=cWqhBjmApyuIp_3glMiQHQVldLihaOKriur_blJE_227YZqZLsAv7E7gjOc3tuL5.; l=eBTvt5Keq7M-YEwjBO5wKurza77OwIdf1sPzaNbMiInca6GAgg8T8NQVz2xXzdtjgtfUSetyNxVOSRFeW-a_WE_ceTwhKXIpB896-; isg=BLe3S5QWpDjc7CLumXuwscXwRqsBfIve3YYoygllbgYyuNT6EU6qLELemhjmUGNW',
                referer:
                    'https://item.taobao.com/item.htm?spm=a230r.1.14.703.1bac4f249d4Js3&id=619699134009&ns=1&abbucket=18'
            },
            transformResponse: [
                data => {
                    const match = data.match(
                        /jsonp_tbcrate_reviews_list\((.+)\)/
                    );
                    if (match) {
                        return JSON.parse(match[1]);
                    }
                    return data;
                }
            ]
        }
    );
};
const getTmData = (pageNum: number = 1, needFold: string = '0') => {
    return axios.get<resIntTm>(
        'https://rate.tmall.com/list_detail_rate.htm?spuId=1589105234&sellerId=3126162346&append=0&content=1&tagId=&posi=&picture=&groupId=&ua=098%23E1hvupvPvBvvUvCkvvvvvjiWP25wtjnCR2sh1jljPmP9tjEhPFcZlj3CP2SOgj3PdvhvmZC2FDCxvhCFOpvCvvXvppvvvvvUvpCWpOGgv8Rz8Zl9ZRAn%2BbyDCcECTWeARFxjb9TxfBAKNxGw4w2WVshw4cC2QEZKK5C2a1n1lBkXw6Ow4w2Wedvw4cC2ARpKK5C2aBVU%2B89Cvv3vpvLxGvLNug9CvvXmp99hjEugvpvIphvvvvvvphCvpCv9vvC2R6CvjvUvvhBGphvwv9vvBHBvpCQmvvChxvgCvvpvvPMMRvhvChCvvvmevpvhphvhHUOCvvBvppvvdvhvmZC2ZoBSvhCxT8QCvvDvp1IGXvCvcTk%2BvpvEphW4oVQvpVlI9vhvHHiwXc2BzHi47IIQt1s1cjt4NYGBRvhvChCvvvv%3D&_ksTS=1605798252518_1214',
        {
            params: {
                itemId: product_id,
                currentPage: pageNum,
                order: '1',
                needFold: needFold,
                callback: 'jsonp1215'
            },
            headers: {
                cookie:
                    'cookie2=1e5ff2ed7165f5bb548f09b9f8fe9959; s=VW8f3hxM; t=00db5613b4729ef18186d0179f2bd45e; cna=/SEgFrkPTB8CAT00oyJzMqVG; UM_distinctid=173f1ac4e6c20e-0517fa470c9ebf-3323767-1fa400-173f1ac4e6dc99; tk_trace=1; dnk=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; tracknick=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; lgc=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; login=true; uc3=id2=VAMSbCeNb2UR&lg2=URm48syIIVrSKA%3D%3D&vt3=F8dCuAJ9cvnM76CkLaU%3D&nk2=1T1vOlufmUTIzQ%3D%3D; uc4=nk4=0%401%2BGqrLicOPW2jU%2FZP2idU2sVmiHU&id4=0%40VhpPUd19tQMUxU4Q5kbO9yQD5cw%3D; Hm_lvt_96bc309cbb9c6a6b838dd38a00162b96=1607632738,1607632989,1608395660,1608564372; hng=CN%7Czh-CN%7CCNY%7C156; lid=%E4%B8%87%E9%98%81%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E4%B8%93%E8%90%A5%E5%BA%97%3A%E6%9C%B1; _tb_token_=e881377bb78b3; enc=vf5cfablyZykMiqFdktLRaVKkoNiKbYYT%2BijpCak7qOzR5rN6BaNnPgS1Z3afBik%2Faq1HKgYuXDz5%2BD03lhIEL4VkO7sTuXuNzOa9jx8KgA%3D; _m_h5_tk=c4ace200dda9a2cb70f5d5c588e2f8dd_1608964881104; _m_h5_tk_enc=e4ca8e53b8856ea8301d6e8f1b91bde6; unb=2207831172436; sn=%E4%B8%87%E9%98%81%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E4%B8%93%E8%90%A5%E5%BA%97%3A%E6%9C%B1; sgcookie=E1000xuaaTSi5wXTkfkx9m%2F3Y8oLijT5aEThVaynpkUsjPSiO59F4PzRi28L99R6HHfKQGxxDjIt8zQK6UofvxDXlA%3D%3D; uc1=cookie21=UIHiLt3xSalX&cookie14=Uoe0ZNcr53hdoA%3D%3D; csg=9385a831; xlly_s=1; x5sec=7b22726174656d616e616765723b32223a223662373631353161396633373463616538623662346330323161333234653533434e4f5a71663846454b476c367071613775546b56526f504d6a49774e7a677a4d5445334d6a517a4e6a7378227d; Hm_lpvt_96bc309cbb9c6a6b838dd38a00162b96=1609190635; tfstk=cfmlBgq9e4zSPX4m53ZSIQtFpjclZRsUsDoj0m9LzkdtOkiVihQV7EmDn7covw1..; l=eBTvt5Keq7M-YaHXBO5Cnurza77TzIObzsPzaNbMiInca6NAahhxCNQ2bgzWudtjgt5v-etrJmGnAReD7ka_Wx_ceTwhKXIpBU968e1..; isg=BBQUzXstNy1meaHnPgojiMqR5VKGbThXO4wgka70_B9rmbbj1n6k5cFfmZEBYXCv',
                referer: `https://item.taobao.com/item.htm?spm=a230r.1.14.703.1bac4f249d4Js3&id=${product_id}&ns=1&abbucket=18`
            },
            transformResponse: [
                data => {
                    const match = data.match(/jsonp1215\((.+)\)/);
                    if (match) {
                        const res = JSON.parse(match[1]);
                        return res;
                    }
                    return data;
                }
            ]
        }
    );
};
// getTmData(1,'1').then(res => {
//     console.log(res.data.rateDetail.rateList[0]);
// });
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
            if (tm_end !== '*' && str.includes(tm_end)) {
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
const getComments = async (pageNum: number, needFold: string = '0') => {
    if (tm_is !== '1') return (await getData(pageNum, needFold)).data;
    const tmData = await getTmData(pageNum, needFold);
    const { rateDetail } = tmData.data;
    const comments = [] as commentInt[];
    if (!rateDetail) return {} as resInt;
    rateDetail.rateList.forEach(comment => {
        comments.push({
            photos: comment.pics.map(pic => {
                return {
                    fileId: comment.id,
                    receiveId: comment.id,
                    thumbnail: pic,
                    url: pic
                };
            }),
            content: comment.rateContent,
            rateId: comment.id,
            video:
                comment.videoList.length > 0
                    ? {
                          cloudVideoUrl: comment.videoList[0].cloudVideoUrl
                      }
                    : undefined,
            append: comment.appendComment
                ? {
                      content: comment.appendComment.content,
                      photos: comment.appendComment.pics.map(pic => {
                          return {
                              fileId: comment.id,
                              receiveId: comment.id,
                              thumbnail: pic,
                              url: pic
                          };
                      })
                  }
                : null
        });
    });
    return {
        maxPage: rateDetail.paginator.lastPage,
        currentPageNum: rateDetail.paginator.page,
        comments: comments
    } as resInt;
};
// getComments(1,'1').then(res=>{
//     console.log(res.comments);
// })
let MAXPAGE: number = 0;
const Start = async (pageNum: number = 1, needFold: string = '0') => {
    console.log(`第${pageNum}页：正在获取的评语...`);
    const result = await getComments(pageNum, needFold);
    const { maxPage, currentPageNum, comments } = result;
    if (MAXPAGE === 0) MAXPAGE = maxPage;
    const STR = new Str(pageNum);
    if (comments) {
        // if(needFold === '1')console.log(comments);
        comments.forEach(comment => {
            let fir = '';
            if (comment.photos && comment.photos.length > 0) {
                fir = `有图片：${comment.photos[0].receiveId}，`;
            }
            STR.add(comment.content, fir);
            // console.log(comment.photos)
            STR.addPhoto(comment.photos);
            if (comment.video && comment.video.cloudVideoUrl)
                // console.log(comment.video.cloudVideoUrl);
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
                if (
                    comment.append.video &&
                    comment.append.video.cloudVideoUrl
                ) {
                    STR.addVideo({
                        receiveId: comment.rateId,
                        url: comment.append.video.cloudVideoUrl
                    });
                }
            }
        });
        console.log(
            `第${pageNum}页/${maxPage}页：得到${comments.length}个评语，正在保存...`
        );
        // if(needFold === '1')console.log(STR);
        await STR.save(currentPageNum === 1 && needFold === '1' ? true : false);
        console.log(`第${pageNum}页/${maxPage}页：保存成功`);
    } else {
        console.log(`第${pageNum}页：保存失败，跳过`);
    }
    console.log('-----------------------------');
    if (STR._end) return;
    if (pageNum < MAXPAGE) {
        const nextPageNum = pageNum + 1;
        await Start(nextPageNum);
        return;
    }
};
// Start(1, '1');
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
    await Start(1);
    // 看下是否有 折叠的评语
    if (tm_fold === '1') {
        console.log('获取折叠评语.................start');
        await Start(1, '1');
        console.log('获取折叠评语.................end');
    }
};
Task()
    .then(() => {
        console.log(`全部保存完成，保存在：${productPath}`);
    })
    .catch(reason => {
        console.log(reason);
    });
