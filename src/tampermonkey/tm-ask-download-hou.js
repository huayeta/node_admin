// ==UserScript==
// @name         获取后台问大家
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://qn.taobao.com/home.htm/comment-manage/ask-all*
// @match        https://myseller.taobao.com/home.htm/comment-manage/ask-all?*
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    const Coments = [];
    const Photos = [];
    let Index = 0; // 图片数字从几开始
    let currentPage = new URLSearchParams(window.location.search.slice(1)).get('current') || 1; // 当前页码
    let next_btn;
    const select_length = 15; // 最小长度
    const select_qz = true; // 是否强制长度
    const is_save_photo = true; // 是否保存评论
    const product_id = new URLSearchParams(window.location.search.slice(1)).get('itemParams');
    const Zip = new JSZip();
    const getIsNext = () => next_btn.getAttribute('disabled') === null;
    const addComment = (str,fir)=>{
        if (
            ((str &&
                !str.includes('此用户没有填写评价') &&
                !str.includes('系统默认好评') &&
                str.length >= +select_length)) ||
            fir
        ) {
            if(select_qz && str.length < +select_length)return;
            // console.log(str)
            Coments.push(`${fir}${str}`);
        }
    }
    const getAsk = (tr,cb=()=>{})=>{
        // console.log(tr);
        // 获取问题
        const title = tr.querySelector('td:nth-child(1)');
        const question = title.querySelector('.question').textContent;// 问题标题
        // 获取答案
        const btn = tr.querySelector('td:nth-child(4) .next-btn-helper');
        const ev = new Event('click',{"bubbles":true, "cancelable":false});
        // 如果没有答案就返回
        if(btn === null) return cb();
        
        btn.dispatchEvent(ev);
        sleep(3000).then(()=>{
            // 点击20页
            document.querySelector('.next-pagination-size-selector-filter').lastElementChild.dispatchEvent(ev);
            return sleep(3000);
        }).then(()=>{
            const answers = document.querySelectorAll('.answer-table-table tbody tr')
            const arr = [];
            // console.log(answers);
            Array.prototype.forEach.call(answers,answer=>{
                const children = answer.querySelector('td:nth-child(1) .answer').childNodes;
                // console.log(children);
                for (const childElement of children) {
                    // console.log(childElement.nodeType)
                    if (childElement.nodeType === Node.TEXT_NODE && childElement.textContent.trim() !== '') {
                        // 如果是文本元素
                        arr.push(childElement.textContent);
                    }
                }
            })
            Coments.push({
                title: question,
                answers: arr,
            })
            // 消除弹窗
            document.querySelector('.next-drawer-close').dispatchEvent(ev);
            cb();
            // console.log(Coments);
        })
    }
    const readComment = (cb) => {
        const ask_table = document.querySelector('.ask-all-manage-config-list-wrap-table');
        const trs = ask_table.querySelectorAll('tbody tr');
        // getAsk(trs[0]);
        // return;
        let len = 0;
        const ju = ()=> {
            if(len<trs.length){
                getAsk(trs[len],()=>{
                    len++;
                    sleep(1000).then(()=>{
                        ju();
                    })
                });
            }else{
                cb && cb();
            }
        }
        ju();
    }
    const clickNext = () => {
        const ev = new Event('click',{"bubbles":true, "cancelable":false});
        next_btn.dispatchEvent(ev);
    }
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    const startTask = (cb) => {
        console.log(`第${currentPage}页开始...`)
        readComment(()=>{
            console.log(Coments);
            console.log(`第${currentPage}页完成...`);
            // return console.log(Coments,Photos);
            if (getIsNext()) {
                clickNext();
                sleep(3000).then(() => {
                    currentPage++;
                    startReadAsk(cb);
                })
            } else {
                console.log(Coments);
                // console.log(Photos);
                cb && cb()
            }
        });
    }
    function startDownload(params) {
        console.log(`正在打包评论...`)
        Zip.generateAsync({ type: "blob" }).then(function (content) {
            console.log('打包成功')
            // 下载的文件名
            var filename = product_id + '-问大家.zip';
            // 创建隐藏的可下载链接
            var eleLink = document.createElement('a');
            eleLink.download = filename;
            eleLink.style.display = 'none';
            // 下载内容转变成blob地址
            const url = URL.createObjectURL(content);
            eleLink.href = url;
            // 触发点击
            document.body.appendChild(eleLink);
            eleLink.click();
            // 然后移除
            document.body.removeChild(eleLink);
            URL.revokeObjectURL(url);
            console.log(`下载完成评论...`)
        });
    }
    function writeJson() {
        const keys = Object.keys(Coments);
        let Text = '';
        keys.forEach((key,index)=>{
            if(index!==0)Text+='\n';
            Text+=`${index+1}:${Coments[key].title}\n`;
            Text+=`${Coments[key].answers.map(text=>`    回答：${text}`).join('\n')}`;
        })
        return Text;
    }
    function download() {
        Zip.file(`问大家.txt`, writeJson());
        startDownload();
    }
    window.startReadAsk = () => {
        next_btn = document.querySelector('.next-pagination-list').nextElementSibling;
        startTask(() => {
            console.log('收集完成,开始下载评论;')
            download();
        });
    }
    console.log('下载问大家函数：startReadAsk()')
})();