// ==UserScript==
// @name         问大家-列表
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        https://market.m.taobao.com/app/mtb/questions-and-answers/pages/list/index.html*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    const qs = [];
    window.proStart = ()=>{
        const items = document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(2)>div');
        Array.prototype.forEach.call(items,(item)=>{
            const title = item.children[0].innerText;
            qs.push(title)
        })
        console.log(qs.join('\n'))
    }
    const json = {'279357450572': {
            title: '有作用吗？',
            targetUrl: 'https://market.m.taobao.com/app/mtb/questions-and-answers/pages/detail/index.html?from=answer&spm=a3134.14087530&id=279357450572&clusterId=279357450572',
            id: '279357450572',
            list: []
        },
        '283561983669': {
            title: '厨房排气扇处的纱窗的油渍可以去掉吗？',
            targetUrl: 'https://market.m.taobao.com/app/mtb/questions-and-answers/pages/detail/index.html?from=answer&spm=a3134.14087530&id=283561983669&clusterId=283561983669',
            id: '283561983669',
            list: []
        }}
    let newW;
    const getLoad = (cb,key)=>{
        const items = newW.document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(3)>div:first-child~div');
        if(items.length!== 0) {
            const qs = [];
            Array.prototype.forEach.call(items,(item)=>{
                const title = item.children[1].children[0].innerText;
                qs.push(title);
            })
            return cb(qs,key);
            return new Promise.resolve(items);
        }
        setTimeout(getLoad.bind(this,cb,key),1000);
    }
    const getIems = ()=>{
        const qs = [];
        const items = newW.document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(3)>div:first-child~div');
        Array.prototype.forEach.call(items,(item)=>{
            const title = item.children[1].children[0].innerText;
            qs.push(title);
        })
        return qs;
    }
    const QS = {};
    const start = (keys)=>{
        if(keys.length === 0){
            console.log(json);
        }else {
            const key = keys.pop();
            newW.document.location.href = json[key].targetUrl;
            setTimeout(()=>{
                getLoad((items,key) => {
                    json[key].list = items;
                    start(keys);
                },key);
            },2000)
        }
    }
    window.pro_start = async ()=>{
        newW = window.open(window.url,"_blank");
        const keys = Object.keys(json);
        start(keys);

    }
})();
