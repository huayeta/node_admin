// ==UserScript==
// @name         获取后台详情页的评论
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://qn.taobao.com/home.htm/comment-manage/list/rateWait4PC?*
// @match        https://myseller.taobao.com/home.htm/comment-manage/list/rateWait4PC?*
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
    const product_id = new URLSearchParams(window.location.search.slice(1)).get('search');
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
    const readComment = () => {
        const trs = document.querySelectorAll('.next-loading-wrap>div>.next-table-medium>table[role=table]>thead~tbody.next-table-body>tr');
        Array.prototype.forEach.call(trs, table => {
            const rates = table.querySelectorAll('.l-rate-content');
            if (rates && rates[0]) {
                const rate =  rates[0];
                // 获取首次评论
                const span = rate.querySelectorAll('.rate-content span');
                const pre_comment = span.length!==0?span[1].textContent:'';
                const pre_photos = [];
                const pre_lis = rate.querySelectorAll('.l-media-gallery img');
                pre_lis && Array.prototype.forEach.call(pre_lis, li => {
                    pre_photos.push(li.getAttribute('src'));
                })
                // console.log(pre_comment, pre_photos);
                if(pre_photos.length > 0){
                    Index = Index+1;
                    Photos.push({ id: Index, photos: pre_photos });
                }
                // Coments.push(pre_photos.length > 0 ? `有图片：${Index}：${pre_comment}` : pre_comment);
                let is_append_str = '';
                if(table.classList.contains('next-table-expanded-row'))is_append_str='追：';
                addComment(pre_comment,pre_photos.length > 0 ? `有图片：${Index}：${is_append_str}` : `${is_append_str}`)
            }
            // if(rates && rates[1]){
            //     const rate =  rates[1];
            //     // 获取追评
            //     const span = rate.querySelectorAll('.rate-content span');
            //     const append_comment = span.length!==0?span[1].textContent:'';
            //     const append_photos = [];
            //     const append_lis = rate.querySelectorAll('.l-media-gallery img');
            //     append_lis && Array.prototype.forEach.call(append_lis, li => {
            //         append_photos.push(li.getAttribute('src'));
            //     })
            //     // console.log(append_comment, append_photos);
            //     if(append_photos.length > 0){
            //         Index = Index+1;
            //         Photos.push({ id: Index, photos: append_photos });
            //     }
            //     // Coments.push(append_photos.length > 0 ? `有图片：${Index}：追：${append_comment}` : `追：${append_comment}`);
            //     addComment(append_comment,append_photos.length > 0 ? `有图片：${Index}：追：` : `追：`);
            // }
        })
        // console.log(Coments);
        // console.log(Photos);
    }
    window.readComment=readComment;
    const clickNext = () => {
        const ev = new Event('click',{"bubbles":true, "cancelable":false});
        next_btn.dispatchEvent(ev);
    }
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    const startTask = (cb) => {
        readComment();
        console.log(`第${currentPage}页完成`);
        // return console.log(Coments,Photos);
        if (getIsNext()) {
            clickNext();
            sleep(6000).then(() => {
                currentPage++;
                startReadComent(cb);
            })
        } else {
            console.log(Coments);
            console.log(Photos);
            cb && cb()
        }
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
            var filename = product_id + '.zip';
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
    function download() {
        Zip.file("评价.txt", Coments.join('\r\n'));
        // Zip.file('图片.txt', JSON.stringify(Photos));
        // startDownload();
        if (!is_save_photo || Photos.length === 0) return startDownload(Zip, product_id);
        var img = Zip.folder("images");
        let index = 0;
        const down_photos = [];
        Photos.forEach(photo => {
            photo.photos.forEach((phot, ind) => {
                down_photos.push(getImgMin(phot, `${photo.id}-${ind}`))
            })
        })
        down_photos.forEach(photo => {
            getBase64Image(photo.url).then(base64 => {
                img.file(`${photo.name}.${photo.min}`, base64.split(',')[1], { base64: true });
                index++;
                console.log(`第${index}/${down_photos.length}个图片下载完成...`)
                if (down_photos.length === index) {
                    startDownload();
                }
            })
        })
    }
    window.startReadComent = () => {
        next_btn = document.querySelector('.next-pagination-list').nextElementSibling;
        startTask(() => {
            console.log('收集完成,开始下载评论;')
            download();
        });
    }
    console.log('下载评论函数：startReadComent()')
})();