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
    // 总结类目
    const sjLink = document.createElement('a');
    sjLink.style='margin-left:10px;';
    sjLink.textContent='总结类目';
    sjLink.addEventListener('click',()=>{
        const uls = document.querySelectorAll('.dts-item');
        const obj = {};
        const arr = [];
        Array.prototype.forEach.call(uls,(ul,index)=>{
            // 去掉广告
            if(index%6!==0){
                const li = ul.querySelector('li:nth-child(4)');
                let text = li.textContent;
                // console.log(text);
                if(!text.includes('点击查询')){
                    text=text.slice(5);
                    if(obj[text]){
                        obj[text]++;
                    }else{
                        obj[text]=1;
                    }
                    if(arr.length===0){
                        arr.push({[text]:1})
                    }else{
                        if(arr[arr.length-1][text]){
                            arr[arr.length-1][text]++;
                        }else{
                            arr.push({[text]:1})
                        }
                    }
                }
            }
        })
        alert(JSON.stringify(obj)+'\n'+JSON.stringify(arr));
        // console.log(obj);
        // console.log(arr);
    },false)
    jPrice.insertAdjacentElement('beforebegin',sjLink);
    // Your code here...
})();