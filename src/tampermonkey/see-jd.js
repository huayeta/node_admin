// ==UserScript==
// @name         查看京东的列表数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  配合阿明工具箱
// @author       You
// @match        https://search.jd.com/Search?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const jPrice = document.querySelector('#J_selectorPrice');
    var eleLink = document.createElement('a');
    eleLink.textContent='查看所有类目';
    eleLink.addEventListener('click',function(){
        // document.querySelector('.text-red.pointer').dispatchEvent(ev);
        const spans = document.querySelectorAll('span.search-btn');
        // Array.prototype.forEach.call(spans,span=>{
        //     const ev = new Event('click',{"bubbles":true, "cancelable":false});
        //     span.dispatchEvent(ev);
        // })
        const spanAs = Array.from(spans);
        function clickSpan(){
            if(spanAs.length>0){
                const ev = new Event('click',{"bubbles":true, "cancelable":false});
                const span = spanAs.splice(0,1)[0];
                if(span.textContent.includes('点击查询')){
                    span.dispatchEvent(ev);
                    setTimeout(clickSpan,300);
                }else{
                    clickSpan();
                }               
            }
        }
        clickSpan();
    },false)
    jPrice.insertAdjacentElement('beforebegin',eleLink);
    // Your code here...
})();