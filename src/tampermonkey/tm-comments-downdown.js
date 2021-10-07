// ==UserScript==
// @name         获取详情页的评论
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.detail.tmall.com/item.htm*
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    const Coments = [];
    const Photos = [];
    let Index = 0;
    let currentPage = 1;
    let next_btn;
    const product_id = new URLSearchParams(window.location.search.slice(1)).get('id');
    const getIsNext = () => next_btn.getAttribute('data-page');
    const readComment = () => {
        const trs = document.querySelectorAll('.rate-grid tr');
        Array.prototype.forEach.call(trs, tr => {
            Index++;
            const master = tr.querySelector('.tm-col-master>.tm-rate-content');
            if (master) {
                // 直接评论
                const comment = master.querySelector('.tm-rate-fulltxt').textContent;
                const photos = [];
                const lis = master.querySelectorAll('.tm-m-photos li');
                lis && Array.prototype.forEach.call(lis, li => {
                    photos.push(li.getAttribute('data-src'));
                })
                // console.log(comment, photos);   
                Coments.push(photos.length > 0 ? `有图片：${Index}：${comment}` : comment);
                photos.length > 0 && Photos.push({ id: Index, photos: photos })
            } else {
                // 获取首次评论
                const premiere = tr.querySelector('.tm-rate-premiere');
                const pre_comment = premiere.querySelector('.tm-rate-fulltxt').textContent;
                const pre_photos = [];
                const pre_lis = premiere.querySelectorAll('.tm-m-photos li');
                pre_lis && Array.prototype.forEach.call(pre_lis, li => {
                    pre_photos.push(li.getAttribute('data-src'));
                })
                // console.log(pre_comment, pre_photos);
                Coments.push(pre_photos.length > 0 ? `有图片：${Index}：${pre_comment}` : pre_comment);
                pre_photos.length > 0 && Photos.push({ id: Index, photos: pre_photos });
                // 获取追评
                Index++;
                const append = tr.querySelector('.tm-rate-append');
                const append_comment = append.querySelector('.tm-rate-fulltxt').textContent;
                const append_photos = [];
                const append_lis = append.querySelectorAll('.tm-m-photos li');
                append_lis && Array.prototype.forEach.call(append_lis, li => {
                    append_photos.push(li.getAttribute('data-src'));
                })
                // console.log(append_comment, append_photos);
                Coments.push(append_photos.length > 0 ? `有图片：${Index}：追：${append_comment}` : `追：${append_comment}`);
                append_photos.length > 0 && Photos.push({ id: Index, photos: append_photos });
            }
        })
        // console.log(Coments);
        // console.log(Photos);
    }
    const clickNext = () => {
        const ev = new Event('click');
        next_btn.dispatchEvent(ev);
    }
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    const startTask = (cb) => {
        readComment();
        console.log(`第${currentPage}页完成`);
        if (getIsNext()) {
            clickNext();
            sleep(3000).then(() => {
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
    function download() {
        var zip = new JSZip();
        zip.file("评价.txt", Coments.join('\r\n'));
        var img = zip.folder("images");
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
                    console.log(`正在下载评论...`)
                    zip.generateAsync({ type: "blob" }).then(function (content) {
                        console.log('转换成功')
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
                    });
                }
            })
        })
    }
    window.startReadComent = () => {
        next_btn = document.querySelector('.rate-paginator').lastElementChild;
        startTask(() => {
            console.log('收集完成,开始下载评论;')
            download();
        });
    }
    console.log('下载评论函数：startReadComent()')
})();