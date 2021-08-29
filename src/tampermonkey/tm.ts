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
function sleep (time:number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
const getData = (pageNum: number = 1, folded: string = '0') => {
    return axios.get<resInt>(
        'https://rate.taobao.com/feedRateList.htm?auctionNumId=626989843655&userNumId=2343541658&currentPageNum=1&pageSize=20&rateType=&orderType=feedbackdate&attribute=&sku=&hasSku=false&folded=0&ua=098%23E1hvj9vWvRyvUvCkvvvvvjiWP2SwAjtbn2qh1jivPmPp6jn8RssWsj3URszhAjtjdvhvmpvCytoLvvmHwQvCvvOv9hCvvvmgvpvIvvCvpvvvvvvvvhNjvvmClvvvBGwvvvUwvvCj1Qvvv99vvhNjvvvmm89Cvv9vvhhzL4N2Fg9CvvOCvhE2gnQUvpCWv8Vs%2B1zEn1mAdc9DYE7rj8TxO3NniLwBHdBYLWsOjEy7RAYVyOvO5fVQWl4vAC9aRfU6pwethb8r5C60dbm65i9OwZRQ0fJ6W3CQoQgCvvpvvPMMRvhvCvvvphmevpvhvvCCBUOCvvpv9hCv9vhvHnMSndQY7rMNzskRMHQbtlPNVas3RvhvCvvvphv%3D&_ksTS=1607725653379_1495&callback=jsonp_tbcrate_reviews_list',
        {
            params: {
                auctionNumId: product_id,
                userNumId: 4146367369,
                currentPageNum: pageNum,
                pageSize: 20,
                folded: '0',
                orderType: 'feedbackdate',
                callback: 'jsonp_tbcrate_reviews_list'
            },
            headers: {
                cookie:
                    'cookie2=1e5ff2ed7165f5bb548f09b9f8fe9959; t=00db5613b4729ef18186d0179f2bd45e; cna=/SEgFrkPTB8CAT00oyJzMqVG; s=VAMUGwcg; hng=CN%7Czh-CN%7CCNY%7C156; dnk=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; tracknick=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; lgc=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; login=true; cancelledSubSites=empty; uc3=lg2=VFC%2FuZ9ayeYq2g%3D%3D&vt3=F8dCujPysh7BAVN1OHk%3D&nk2=1T1vOlufmUTIzQ%3D%3D&id2=VAMSbCeNb2UR; uc4=nk4=0%401%2BGqrLicOPW2jU%2FZP2qAQNzshAhG&id4=0%40VhpPUd19tQMUxU4Q5LIgJKZk6I0%3D; lid=%E8%89%BE%E8%B7%83%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E6%97%97%E8%88%B0%E5%BA%97%3A%E6%9C%B1; _tb_token_=ea8b8b3367b6e; enc=PRjDKsNVwVadB6YKv9EXyAWfWCcaR5FEX758k43Yl8hXqVQZTcgXeyy0kZL5G5myzT7HD2JhEym3%2BFr3oP5qIUcCJ4l25zlblbS4Nb7jpMI%3D; sgcookie=E100HzqH3QV%2Fzb1VN07BgcMHRIaT3aglV0Q4pJQ6tr68RE3mz8MtObun96EWRTG46I7KCQBDyolQwXwoEc5a3tF6FQ%3D%3D; uc1=cookie21=WqG3DMC9Eman&cookie14=Uoe2xe1z83nF6g%3D%3D; csg=7876131e; UM_distinctid=17b47a7303a14c-0794b450f45d6b-4343363-1fa400-17b47a7303b53c; tk_trace=oTRxOWSBNwn9dPyorMJE%2FoPdY8zMG1aAN%2F0TkjYGZjkj6rrK3kv4LgxGhtlxvv5CwTD%2BouWTjev%2BBoE%2FW%2F6%2BfBhbVU26TyCIQKsu6MFrbAFUa6jZPN8vKrzMCPqiyInCoJhgD1HvBvb55u7%2F5xZ%2BZft4Nzl3WwDYzrKi1wwW1ZMJ%2BHanEzoLeuxO1Mn%2BcwNvX8L5CcXwg2JyoyPWD3Xw7u%2BpXSh0ZeBvwqbfIjI9KZO%2FQHsebo0Q58uHGLuzaJM15jOANEahFI7NrRzrVSSMNg0F4FR7z%2Bq%2FTGaFThEQWxhTnCEDm12SO3%2BQgiSyd7I36OdePU1YpVwlejtDlEd7Y29%2FNFAT0%2BgWqx%2FZYyxiMD8hXa77; miid=2957659351951425633; _m_h5_tk=a7ebaf033d43f86a2a5a64a7573d3e75_1629105667421; _m_h5_tk_enc=41500bbb1706e6af3b815fb5cdc47f81; xlly_s=1; Hm_lvt_96bc309cbb9c6a6b838dd38a00162b96=1626710377,1629185998; Hm_lpvt_96bc309cbb9c6a6b838dd38a00162b96=1629186176; tfstk=cbnFBANzLHKFIzEWkkZyAMEzKxRdaVMnEGyb-VFLQtuVAdz3gsfdwRbuhRy7Mh4h.; l=eBTvt5Keq7M-YcFjBO5wKurza77t6IOf1sPzaNbMiInca6CPaFsTjNCKIrDpudtjgt5XRetrSSYwjRFy7maU-x_ceTwhKXIpBiJ68e1..; isg=BCIil_Qht2ZgdpdN_MQNAmi3c6iEcyaNng_DeWy6OhVKP8G5VADPnG_5b3vDL54l',
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
        'https://rate.tmall.com/list_detail_rate.htm?spuId=1171332549&sellerId=3126162346&append=0&content=1&tagId=&posi=&picture=&groupId=&ua=098%23E1hvqvvXvXgvUvCkvvvvvjiWPFcUAjrbR2LvQjYHPmPWtj1PPsq96j3WP2LW1j1UdvhvmpvWSQRw5v2wC29Cvvpvvvvv9vhv2nMScrza7rMNz0yfz8QCvvyvmvQhbkgv1He%2BvpvEvv9uCvZHvb1wRvhvCvvvvvm%2BvpvEvvsIvSdTvmmM9vhv2nMSlc1F7rMNzQvBz8OCvvpvvUmmRvhvCvvvvvvRvpvhvv2MMQ9CvhQvKapvC0kDyO2v5fh3Zi7v1WpaRoxBlwet9b8rwkM6D7zWdiZDN%2B3l%2B87JejEHtnkQ0fJ6EvLvqU0HKfE9ZwFIAXZTKFEw98c6D404kvhvC99vvOCtoT9Cvv9vvUmYHpvQHd9Cvm9vvvvvphvvvvvv96CvpvAevvm2phCvhRvvvUnvphvppvvv96CvpCCvvvhvC9vhvvCvpUOCvvpvCvvvRvhvCvvvvvmvvpvWzMa0cCBwzYMNUvbwdvhvmpvUrQnboQCwVuQCvCtZmPQ2X0wvDnME%2B2IDZO7a6Rm4dzHHQW2v1C9ww18%2BvpvEvvFxvMf0v8pqdvhvmpvUBvW5EQm%2B0uQCvvyv28v29gWvrP0vvpvWzMJK5RY4zYMNKLLw&needFold=0&_ksTS=1629220063698_572',
        {
            params: {
                itemId: product_id,
                currentPage: pageNum,
                order: '1',
                // needFold: needFold,
                callback: 'jsonp573'
            },
            headers: {
                "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
                "sec-ch-ua-mobile":"?0",
                "sec-fetch-dest":"script",
        "sec-fetch-mode":"no-cors",
        "sec-fetch-site":"same-site",
        "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
                cookie:
                    'cookie2=1e5ff2ed7165f5bb548f09b9f8fe9959; t=00db5613b4729ef18186d0179f2bd45e; s=VAMUGwcg; hng=CN%7Czh-CN%7CCNY%7C156; dnk=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; tracknick=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; lgc=%5Cu72EC%5Cu7EBF%5Cu65C5%5Cu7A0B%5Cu5355; login=true; cancelledSubSites=empty; uc3=lg2=VFC%2FuZ9ayeYq2g%3D%3D&vt3=F8dCujPysh7BAVN1OHk%3D&nk2=1T1vOlufmUTIzQ%3D%3D&id2=VAMSbCeNb2UR; uc4=nk4=0%401%2BGqrLicOPW2jU%2FZP2qAQNzshAhG&id4=0%40VhpPUd19tQMUxU4Q5LIgJKZk6I0%3D; lid=%E8%89%BE%E8%B7%83%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E6%97%97%E8%88%B0%E5%BA%97%3A%E6%9C%B1; _tb_token_=ea8b8b3367b6e; enc=PRjDKsNVwVadB6YKv9EXyAWfWCcaR5FEX758k43Yl8hXqVQZTcgXeyy0kZL5G5myzT7HD2JhEym3%2BFr3oP5qIUcCJ4l25zlblbS4Nb7jpMI%3D; UM_distinctid=17b47a7303a14c-0794b450f45d6b-4343363-1fa400-17b47a7303b53c; tk_trace=oTRxOWSBNwn9dPyorMJE%2FoPdY8zMG1aAN%2F0TkjYGZjkj6rrK3kv4LgxGhtlxvv5CwTD%2BouWTjev%2BBoE%2FW%2F6%2BfBhbVU26TyCIQKsu6MFrbAFUa6jZPN8vKrzMCPqiyInCoJhgD1HvBvb55u7%2F5xZ%2BZft4Nzl3WwDYzrKi1wwW1ZMJ%2BHanEzoLeuxO1Mn%2BcwNvX8L5CcXwg2JyoyPWD3Xw7u%2BpXSh0ZeBvwqbfIjI9KZO%2FQHsebo0Q58uHGLuzaJM15jOANEahFI7NrRzrVSSMNg0F4FR7z%2Bq%2FTGaFThEQWxhTnCEDm12SO3%2BQgiSyd7I36OdePU1YpVwlejtDlEd7Y29%2FNFAT0%2BgWqx%2FZYyxiMD8hXa77; miid=2957659351951425633; cna=LbybGYDLvFUCASeiIRH1x2hp; Hm_lvt_96bc309cbb9c6a6b838dd38a00162b96=1629185998,1629532507,1629532758; _m_h5_tk=c3c9ef0623db709de50e1d82b0ab3499_1629816472946; _m_h5_tk_enc=b583345e50fa4775231a4e4f10031181; xlly_s=1; sgcookie=E100%2B6Xs1KotwrmLXEQYNoA39vjDy9QUhkOfwUOGPEI3iwIZmBP%2B4WE2S4wKne71NTxNOmb0F9ZAENuYORsH6FFWJg%3D%3D; csg=ea82408b; unb=2210640100308; sn=%E8%89%BE%E8%B7%83%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E6%97%97%E8%88%B0%E5%BA%97%3A%E6%9C%B1; uc1=cookie21=U%2BGCWk%2F7oPIg&cookie14=Uoe2xMrvqlHrwA%3D%3D; x5sec=7b22617365727665723b32223a223464353265363266623631323331666165613733386639383130613537396166434a62536d596b47454e54346c355366324f663351426f504d6a49784d4459304d4445774d444d774f4473784d4b366838593043227d; Hm_lpvt_96bc309cbb9c6a6b838dd38a00162b96=1629907228; tfstk=cgV5Bw_By3x52sWeaz_24eWkL6GlZWLsRTiuPR7VWLbkLYz5iSAZfJFLKHdxBq1..; l=eBTvt5Keq7M-Y516BO5wnurza77tiIRf1sPzaNbMiInca6ZPaFGLKNCK4Wj6udtjgtfXKetrSSYwjRhy-74LRE_ceTwhKXIpBrvw-; isg=BA8PXA5psiCEnIoWcaPoKW04nqMZNGNWu_C-giEcLn6K8CzyKQWKpqym8iDOiDvO',
                referer: `https://item.taobao.com/item.htm?spm=a230r.1.14.703.1bac4f249d4Js3&id=${product_id}&ns=1&abbucket=18`
            },
            transformResponse: [
                data => {
                    const match = data.match(/jsonp573\((.+)\)/);
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
            // console.log(wr_url)
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
//     '//img.alicdn.com/bao/uploaded/i4/O1CN01zx3QYM2LBaJx3a26T_!!0-rate.jpg',
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
    if (!rateDetail) {
        console.log(tmData.data)
        return {} as resInt;
    }
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
                      content: `追：`+comment.appendComment.content,
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
        console.log(result);
        console.log(`第${pageNum}页：保存失败，跳过`);
    }
    console.log('-----------------------------');
    if (STR._end) return;
    if (pageNum < MAXPAGE) {
        const nextPageNum = pageNum + 1;
        await sleep(1000);
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
