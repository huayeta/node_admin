// ==UserScript==
// @name         获取前台wap详情页的评论
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://h5.m.taobao.com/app/rate/www/rate-list*
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    let Coments = [];
    const Photos = [];
    let Index = 0; // 图片数字从几开始
   // let currentPage = 1; // 当前页码
   // let next_btn;
    const select_length = 15; // 最小长度
    const select_qz = true; // 是否强制长度
    const is_save_photo = true; // 是否保存评论
    //const sleep_time = 3000; //延迟多久开始下一页拉去
    window.is_comment_download_now = false; // 是否立即触发下载
    let Counter = 0; // 下载图片的进度
    let ImgLength = 0; // 总图片的length
    const maxDownload = 200; // 一次下载图片最多多少
    const product_id = new URLSearchParams(window.location.search.slice(1)).get('auctionNumId');
    const Zip = new JSZip();
    const addComment = ({comment,time},fir)=>{
        if (
            ((comment &&
                !comment.includes('此用户没有填写评价') &&
                !comment.includes('系统默认好评') &&
                comment.length >= +select_length)) ||
            fir
        ) {
            if(select_qz && comment.length < +select_length)return;
            // console.log(comment)
            Coments.push({comment:`${fir}${comment}`,time});
        }
    }
    const commentSort =()=>{
        Coments= Coments.sort((a,b)=>{
            const aTime = new Date(a.time);
            const bTime = new Date(b.time);
            if(aTime<bTime){
                return 1
            }else if(aTime>bTime){
                return -1;
            }else{
                return 0;
            }
        }).map(obj=>obj.comment);
    }
    const readComment = () => {
        const trs = document.querySelectorAll('.rax-view-v2.rax-scrollview-webcontainer .card__main');
        Array.prototype.forEach.call(trs, tr => {
            // 直接评论
            const comment = [...tr.children].filter(div=>div.classList.contains('card__content'))[0].textContent;
            const photos = [];
            const lis = [...tr.children].filter(div=>div.classList.contains('card__pictures-main'))[0].querySelectorAll('img');
            lis && Array.prototype.forEach.call(lis, li => {
                photos.push(li.getAttribute('src'));
            })
            // console.log(comment, photos);
            if(photos.length>0){
                Index = Index+1;
                Photos.push({ id: Index, photos: photos })
            }
            // Coments.push(photos.length > 0 ? `有图片：${Index}：${comment}` : comment);
            const time = [...tr.children].filter(div=>div.classList.contains('card__sku'))[0].textContent.match(/^\d+?-\d+?-\d+? /)[0];
            addComment({time,comment},photos.length>0?`有图片：${Index}：`:'')
            // 获取追评
            const appendList = [...tr.children].filter(div=>div.classList.contains('card__append-rate-main'));
            if(appendList.length>0){
                const append = appendList[0];
                const append_comment = append.querySelector('.card__append-rate-content').textContent;
                const append_photos = [];
                const append_lis = append.querySelectorAll('.card__pictures-main img');
                append_lis && Array.prototype.forEach.call(append_lis, li => {
                    append_photos.push(li.getAttribute('src'));
                })
                // console.log(append_comment, append_photos);
                if(append_photos.length > 0){
                    Index = Index+1;
                    Photos.push({ id: Index, photos: append_photos });
                }
                // Coments.push(append_photos.length > 0 ? `有图片：${Index}：追：${append_comment}` : `追：${append_comment}`);
                addComment({time,comment:append_comment},append_photos.length > 0 ? `有图片：${Index}：追：` : `追：`);
            }
            
        })
        // console.log(Coments);
        // console.log(Photos);
        // 排序
        commentSort();
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
    /**
     * 下载JSZip对象
     * @param {JSZip} zipD 下载的对象
     * @param {string} filenameA 下载的文件名 
     * @param {function} cb 下载完成后的回调函数
     */
    function startDownload(zipD,filenameA=product_id,cb=()=>{}) {
        console.log(`正在打包评论...`)
        zipD.generateAsync({ type: "blob" }).then(function (content) {
            // 下载的文件名
            var filename = filenameA + '.zip';
            console.log(`打包成功...-${filename}`)
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
            console.log(`下载完成评论...-${filename}`);
            cb();
        });
    }
    /**
     * 给JSZip添加图片
     * @param {JSZip} zipD 添加图片的JSZip对象 
     * @param {array} imgArr 添加图片的数组
     * @param {function} cb 添加完图片后的回调函数
     */
    function pushImg(zipD=Zip,imgArr=[],cb) {
        var img = zipD.folder('images');
        let index = 0;
        imgArr.forEach(photo => {
            getBase64Image(photo.url).then(base64 => {
                img.file(`${photo.name}.${photo.min}`, base64.split(',')[1], { base64: true });
                Counter++;
                index++;
                console.log(`第${Counter}/${ImgLength}个图片下载完成...`)
                if (imgArr.length === index) {
                    cb();
                }
            })
        })
    }
    /**
     * 开始下载图片
     * @param {array} imgArr 下载的图片数组 
     * @param {string} imgFolder 下载zip的名字
     * @param {function} cb 下载完成后的回调函数 
     */
    function startImagesDownload(imgArr=[],imgFolder='images',cb=()=>{}) {
        const zip1 = new JSZip();
        pushImg(zip1,imgArr,()=>{
            startDownload(zip1,imgFolder,cb)
        })
    }
    /**
     * 循环下载图片
     * @param {array} imgArr 需要下载的图片总数组 
     * @param {function} cb 下载成功后的毁掉函数
     */
    let imgIndex = 0;
    function loopImagesDownload(imgArr=[],cb=()=>{}) {
        const arr = imgArr.splice(0,maxDownload);
        imgIndex++;
        startImagesDownload(arr,`${product_id}-images-${imgIndex}`,()=>{
            if(imgArr.length>0){
                loopImagesDownload(imgArr,cb)
            }else{
                cb();
            }
        })
    }
    function download() {
        Zip.file("评价.txt", Coments.join('\r\n'));
        // Zip.file('图片.txt', JSON.stringify(Photos));
        // startDownload();
        if(!is_save_photo) return startDownload();
        const down_photos = [];
        Photos.forEach(photo => {
            photo.photos.forEach((phot, ind) => {
                down_photos.push(getImgMin(phot, `${photo.id}-${ind}`))
            })
        })
        ImgLength = down_photos.length;
        if(ImgLength<= maxDownload){
            pushImg(Zip,down_photos,()=>{
                startDownload(Zip,product_id);
            })
        }else{
            startDownload(Zip,`${product_id}-comments`,()=>{
                loopImagesDownload(down_photos);
            })
        }
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
    const startTask = (cb) => {
        readComment();
        console.log(Coments);
        console.log(Photos);
        cb && cb()
    }
    window.startReadComent = () => {
        startTask(() => {
            console.log('收集完成,开始下载评论;')
            download();
        });
    }
    console.log('下载评论函数：startReadComent()')
})();