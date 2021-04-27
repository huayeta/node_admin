// ==UserScript==
// @name         问大家-详情
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        https://market.m.taobao.com/app/mtb/questions-and-answers/pages/detail/index.html*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    const qs = [];
    window.ks = ()=>{
        const items = document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(3)>div:first-child~div');
        Array.prototype.forEach.call(items,(item)=>{
            const title = item.children[1].children[0].innerText;
            qs.push(title);
        })
        console.log(qs.join('\n'))
    }

})();
