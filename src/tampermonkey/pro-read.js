const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
require('dotenv').config();
const fse = require('fs-extra');

const {
    tm_product_id: product_id
} = process.env;

let QS = {};

(async ()=>{
    const browser = await puppeteer.launch({headless:false,isMobile:true,executablePath:"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",ignoreDefaultArgs: ['--mute-audio']});
    const page = await browser.newPage();
    // await page.emulate(iPhone);
    page.on('requestfinished',(interceptedRequest)=>{
        const url = interceptedRequest.url();
        if(url.includes('mtop.taobao.social.feed.aggregate')){
            interceptedRequest.response().text().then(res=>{
                const match = res.match(/\w\d+\((.+)\)/);
                if (match) {
                    const data = JSON.parse(match[1]);
                    if(data.data.item){
                        const list = data.data.list;
                        list.forEach(item=>{
                            const id = item[0].id;
                            QS[id]={
                                title: item[0].title,
                                targetUrl: item[0].targetUrl,
                                id:item[0].id,
                                list:[]
                            }
                        })
                        fse.writeFile('json.json',JSON.stringify(QS))
                    }
                }
            })
        }
        if(url.includes('mtop.taobao.social.ugc.post.detail')){
            interceptedRequest.response().text().then(res=>{
                const match = res.match(/\w\d+\((.+)\)/);
                if (match) {
                    const data = JSON.parse(match[1]);
                    if(data.data.list){
                        const list = data.data.list.list;
                        const id = data.data.id;
                        list.forEach(item=>{
                            QS[id].list.push(item.title)
                        })
                        // console.log(QS)
                    }
                }
            })
        }
    })
    page.on('load',async ()=>{
        const url = page.url();
        console.log(url)
        console.log(QS);
    })
    await page.goto(`https://login.taobao.com/member/login.jhtml?f=top&redirectURL=https://market.m.taobao.com/app/mtb/questions-and-answers/pages/list/index.html?refId=${product_id}`);
    await page.evaluate(async ()=>{

    })
    await page.screenshot({path: 'example.png'});
    // await browser.close();
})()