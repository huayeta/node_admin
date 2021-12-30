// ==UserScript==
// @name         获取后台问大家
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://rate.taobao.com/sellercenterv2/index.htm/ask-all*
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
    const product_id = new URLSearchParams(window.location.search.slice(1)).get('searchParams');
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
    const getAsk = (tr,cb)=>{
        // console.log(tr);
        // 获取问题
        const title = tr.querySelector('td:nth-child(2)');
        const question = title.querySelector('.question').textContent;// 问题标题
        // 获取答案
        const btn = tr.querySelector('td:nth-child(1) span');
        const ev = new Event('click',{"bubbles":true, "cancelable":false});
        btn.dispatchEvent(ev);
        sleep(2000).then(()=>{
            const answers = tr.nextElementSibling.querySelectorAll('tbody>tr');
            const arr = [];
            // console.log(answers);
            Array.prototype.forEach.call(answers,answer=>{
                const t = answer.querySelector('td:nth-child(1) .answer').textContent;
                arr.push(t);
            })
            Coments.push({
                title: question,
                answers: arr,
            })
            cb();
            // console.log(Coments);
        })
    }
    const readComment = (cb) => {
        const ask_table = document.querySelector('.ask-all-manage-config-list-wrap-table');
        const trs = ask_table.querySelectorAll('tbody tr');
        // getAsk(trs[0]);
        let len = 0;
        const ju = ()=> {
            if(len<trs.length){
                getAsk(trs[len],()=>{
                    len++;
                    ju();
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
                    startReadComent(cb);
                })
            } else {
                console.log(Coments);
                // console.log(Photos);
                cb && cb()
            }
        });
    }
    function getBase64Image(src) {
        return new Promise((resolve, reject) => {
            var img = document.createElement('img');
            img.setAttribute("crossOrigin", 'Anonymous');
            img.onload = function () {
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, img.width, img.height);
                // console.log(canvas.toDataURL);
                var dataURL = canvas.toDataURL("image/png");
                resolve(dataURL);
            }
            img.onerror = function () {
                reject();
            }
            img.src = src;
        })
    }
    function getImgMin(src, name) {
        let url = src;
        if (url.startsWith('//')) url = 'https:' + url;

        const match = url.match(/^(.+?)_\d+x\d+\.\w+$/);
        if (match) url = match[1];

        let min = 'jpg';
        const match_min = url.match(/\/([^\/]+?)\.(\w+?)$/);
        if (match_min) {
            name = name || match_min[1];
            min = match_min[2];
        }
        return {
            url,
            name,
            min
        }
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
            eleLink.href = URL.createObjectURL(content);
            // 触发点击
            document.body.appendChild(eleLink);
            eleLink.click();
            // 然后移除
            document.body.removeChild(eleLink);
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
        // Zip.file('图片.txt', JSON.stringify(Photos));
        // startDownload();
        // if(!is_save_photo) return startDownload();
        // var img = Zip.folder("images");
        // let index = 0;
        // const down_photos = [];
        // Photos.forEach(photo => {
        //     photo.photos.forEach((phot, ind) => {
        //         down_photos.push(getImgMin(phot, `${photo.id}-${ind}`))
        //     })
        // })
        // down_photos.forEach(photo => {
        //     getBase64Image(photo.url).then(base64 => {
        //         img.file(`${photo.name}.${photo.min}`, base64.split(',')[1], { base64: true });
        //         index++;
        //         console.log(`第${index}/${down_photos.length}个图片下载完成...`)
        //         if (down_photos.length === index) {
        //             startDownload();
        //         }
        //     })
        // })
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