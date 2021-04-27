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
const getProList = (pageNum: number = 1, needFold: string = '0') => {
    return axios.get<resIntTm>(
        'https://h5api.m.taobao.com/h5/mtop.taobao.social.feed.aggregate/1.0/?jsv=2.5.1&appKey=12574478&api=mtop.taobao.social.feed.aggregate&v=1.0&preventFallback=true&type=jsonp&dataType=jsonp',
        {
            params: {
                t: '1619013500233',
                sign: '62e8398e55fcfa1a73faf59742c69aa7',
                callback: 'mtopjsonp1',
                data: {"targetId":"621351621045"}
            },
            headers: {
                cookie:
                    'thw=cn; ali_ab=221.15.232.106.1570945525551.6; cookie2=1e5ff2ed7165f5bb548f09b9f8fe9959; _utk=VocP@qJyn^AtWdm; _samesite_flag_=true; t=00db5613b4729ef18186d0179f2bd45e; ctoken=0KgSC7yrHRGnT9X9WkEIrhllor; linezing_session=gAUbenCUyyXJa584o6RsER5M_1604342416206XyJZ_5; oa2=892c975f31a45145afd84befa2559b55; UM_distinctid=17799dda3b774b-0073bb1b1b04b5-c791039-1fa400-17799dda3b8db0; tk_trace=oTRxOWSBNwn9dPyorMJE%2FoPdY8zMG1aAN%2F0TkjYGZjkj6rrK3kv4LgxGhtlxvv2n251iRZBLi5%2BxLVnyk1ChKBAAjPnFedEx498MmWeze9KfIusL7izGSIz%2BGWKC1f4Ei7E9RhaWr47DM1may3Nf8kAQDteIeRUYPBHXKDJ1mSoNV9E63lecoVJ%2FozUK2Dj0U91VLsYyz71Hf%2FIy6BVgT0NSzoU9TcLiSVM4PaVvcxgTrzHTwebKNgUWZIiod0bEoPPCOnUOO3BwSEAaCc9lvJ5ftRu8Y%2B1fQJg%2B%2FIlqOO7kzi%2Bw6D1nlmEHst5%2BcKEV%2BLbTMaU1UyspOFZWTy5O7ou3jqPKDxLj8Ozi4rQDf%2BpKXGGNUpuEwQ%3D%3D; cna=/SEgFrkPTB8CAT00oyJzMqVG; hng=CN%7Czh-CN%7CCNY%7C156; v=0; mt=ci%3D-1_1; lgc=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; dnk=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; tracknick=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; enc=gw44ZNbATcSirUmTFwjQ4K2F5v5%2Fpw0UomyLGXeGJ3%2BQuSNvDpIH%2F9laYKZsLzchskMPqxvPskOsp%2FZJOHaFQje5FGec1Q8t6la%2Fbn%2BPBc0%3D; x=e%3D1%26p%3D*%26s%3D0%26c%3D0%26f%3D0%26g%3D0%26t%3D0; Hm_lvt_96bc309cbb9c6a6b838dd38a00162b96=1617720260,1617720579,1617793102,1617793102; xlly_s=1; _tb_token_=574545a9354db; sgcookie=E100nirfAOCqg6cCPL3ENSnIc2XlHcHIxX4s%2FE9DNxUAaaK7mDYw2sXmpWRq2sMLIIQs442x38RQEfcTRt7mjCeBuA%3D%3D; uc3=id2=UUphzOVxh0qcKbPFUg%3D%3D&vt3=F8dCuwudAeTtO8a%2FnBI%3D&lg2=UtASsssmOIJ0bQ%3D%3D&nk2=saDOo3ihwnk%3D; csg=ddc1e2ce; skt=cbcff82403ea06a7; existShop=MTYxNzg1MTg2NQ%3D%3D; uc4=nk4=0%40s8WOEy%2B5Iw8R3mF3lyEA4P8Eew%3D%3D&id4=0%40U2grF86%2BBspCia2nYzCNm8385sseufP9; _cc_=UtASsssmfA%3D%3D; Hm_lpvt_96bc309cbb9c6a6b838dd38a00162b96=1617852483; tfstk=ccXPBScBi8ez8o9Q6L9EREq5DT9RZDIlxx-6ZscTrKRnHhdli2upmufM0HTTnQf..; l=eBEPUtp4jSi-FvQCBOfwourza77OjIRAguPzaNbMiOCPOCCpJhSdW6ZEUCY9CnGVh6fXR35VLnkHBeYBqIv4n5U62j-la1Mmn; _m_h5_tk=f90c577ff0722d469798764fde1e6633_1617863297449; _m_h5_tk_enc=a9efdcbf85ec2c70afed17bcd78870bc; isg=BAsLXkqD77z08TO3vcvWdK2pmq_1oB8ifvNIaX0I58qhnCv-BXCvcqkucJpyp3ca',
                referer: `https://item.taobao.com/item.htm`
            },
            transformResponse: [
                data => {
                    const match = data.match(/mtopjsonp1\((.+)\)/);
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
// getProList(1,'1').then(res => {
//     console.log(res.data);
// });
const getProDetail = (pageNum: number = 1, needFold: string = '0') => {
    return axios.get<resIntTm>(
        'https://h5api.m.taobao.com/h5/mtop.taobao.social.ugc.post.detail/2.0/?jsv=2.5.1&appKey=12574478&api=mtop.taobao.social.ugc.post.detail&v=2.0&preventFallback=true&type=jsonp&dataType=jsonp&callback=mtopjsonp1',
        {
            params: {
                t: '1617854547854',
                sign: '28cdaead60c1ea29fb26e7ff1c8b4551',
                callback: 'mtopjsonp1',
                data: {"id":"237772593577","params":"{\"from\":\"answer\"}"}
            },
            headers: {
                cookie:
                    'thw=cn; ali_ab=221.15.232.106.1570945525551.6; cookie2=1e5ff2ed7165f5bb548f09b9f8fe9959; _utk=VocP@qJyn^AtWdm; _samesite_flag_=true; t=00db5613b4729ef18186d0179f2bd45e; ctoken=0KgSC7yrHRGnT9X9WkEIrhllor; linezing_session=gAUbenCUyyXJa584o6RsER5M_1604342416206XyJZ_5; oa2=892c975f31a45145afd84befa2559b55; UM_distinctid=17799dda3b774b-0073bb1b1b04b5-c791039-1fa400-17799dda3b8db0; tk_trace=oTRxOWSBNwn9dPyorMJE%2FoPdY8zMG1aAN%2F0TkjYGZjkj6rrK3kv4LgxGhtlxvv2n251iRZBLi5%2BxLVnyk1ChKBAAjPnFedEx498MmWeze9KfIusL7izGSIz%2BGWKC1f4Ei7E9RhaWr47DM1may3Nf8kAQDteIeRUYPBHXKDJ1mSoNV9E63lecoVJ%2FozUK2Dj0U91VLsYyz71Hf%2FIy6BVgT0NSzoU9TcLiSVM4PaVvcxgTrzHTwebKNgUWZIiod0bEoPPCOnUOO3BwSEAaCc9lvJ5ftRu8Y%2B1fQJg%2B%2FIlqOO7kzi%2Bw6D1nlmEHst5%2BcKEV%2BLbTMaU1UyspOFZWTy5O7ou3jqPKDxLj8Ozi4rQDf%2BpKXGGNUpuEwQ%3D%3D; cna=/SEgFrkPTB8CAT00oyJzMqVG; hng=CN%7Czh-CN%7CCNY%7C156; v=0; mt=ci%3D-1_1; lgc=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; dnk=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; tracknick=%5Cu4E00%5Cu5B57%5Cu65F6%5Cu95F4; enc=gw44ZNbATcSirUmTFwjQ4K2F5v5%2Fpw0UomyLGXeGJ3%2BQuSNvDpIH%2F9laYKZsLzchskMPqxvPskOsp%2FZJOHaFQje5FGec1Q8t6la%2Fbn%2BPBc0%3D; x=e%3D1%26p%3D*%26s%3D0%26c%3D0%26f%3D0%26g%3D0%26t%3D0; Hm_lvt_96bc309cbb9c6a6b838dd38a00162b96=1617720260,1617720579,1617793102,1617793102; xlly_s=1; _tb_token_=574545a9354db; sgcookie=E100nirfAOCqg6cCPL3ENSnIc2XlHcHIxX4s%2FE9DNxUAaaK7mDYw2sXmpWRq2sMLIIQs442x38RQEfcTRt7mjCeBuA%3D%3D; uc3=id2=UUphzOVxh0qcKbPFUg%3D%3D&vt3=F8dCuwudAeTtO8a%2FnBI%3D&lg2=UtASsssmOIJ0bQ%3D%3D&nk2=saDOo3ihwnk%3D; csg=ddc1e2ce; skt=cbcff82403ea06a7; existShop=MTYxNzg1MTg2NQ%3D%3D; uc4=nk4=0%40s8WOEy%2B5Iw8R3mF3lyEA4P8Eew%3D%3D&id4=0%40U2grF86%2BBspCia2nYzCNm8385sseufP9; _cc_=UtASsssmfA%3D%3D; Hm_lpvt_96bc309cbb9c6a6b838dd38a00162b96=1617852483; tfstk=ccXPBScBi8ez8o9Q6L9EREq5DT9RZDIlxx-6ZscTrKRnHhdli2upmufM0HTTnQf..; l=eBEPUtp4jSi-FvQCBOfwourza77OjIRAguPzaNbMiOCPOCCpJhSdW6ZEUCY9CnGVh6fXR35VLnkHBeYBqIv4n5U62j-la1Mmn; _m_h5_tk=f90c577ff0722d469798764fde1e6633_1617863297449; _m_h5_tk_enc=a9efdcbf85ec2c70afed17bcd78870bc; isg=BAsLXkqD77z08TO3vcvWdK2pmq_1oB8ifvNIaX0I58qhnCv-BXCvcqkucJpyp3ca',
                referer: `https://item.taobao.com/item.htm`
            },
            transformResponse: [
                data => {
                    const match = data.match(/mtopjsonp1\((.+)\)/);
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
getProDetail(1,'1').then(res => {
    console.log(res.data);
});
