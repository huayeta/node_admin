// ==UserScript==
// @name         获取前台wap详情页的评论
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  用手机页面下载评论，直接手动拖动到评论底部，出现验证码要把开发工具关掉变成电脑页面再去滑动验证，要不然不会成功
// @author       You
// @match        https://h5.m.taobao.com/app/rate/www/rate-list*
// @match        https://meta.m.taobao.com/app/taobao-ugc-community/rate-list/*
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @grant        none
// ==/UserScript==
// 比如：https://h5.m.taobao.com/app/rate/www/rate-list/index.html?auctionNumId=969053722591
// 比如：https://meta.m.taobao.com/app/taobao-ugc-community/rate-list/?rateInfo={"itemId":"867886200962","feedId":"","sellerId":"","shopId":"","exParams":{"openMode":"","clickTimeMS":"","navTimeMS":"","rateType":"-8","bizChannel":"ttdetail_h5"},"commentCount":"","itemInfo":{},"keyword":{"attribute":"","word":""},"invokeSource":0,"detailRate":{},"rateKeywordList":[],"skuInfo":{},"askInfo":{},"rateType":"","foldFlag":"","clickTimeMS":"","navTimeMS":""}
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
    window.is_save_photo = true; // 是否保存图片
    //const sleep_time = 3000; //延迟多久开始下一页拉去
    window.is_comment_download_now = false; // 是否立即触发下载
    let Counter = 0; // 下载图片的进度
    let ImgLength = 0; // 总图片的length
    const maxDownload = 200; // 一次下载图片最多多少
    const product_id = JSON.parse(new URLSearchParams(window.location.search.slice(1)).get('rateInfo')).itemId;
    const Zip = new JSZip();
    const addComment = ({ comment }, fir) => {
        if (
            ((comment &&
                !comment.includes('此用户没有填写评价') &&
                !comment.includes('系统默认好评') &&
                !comment.includes('该用户觉得商品非常好') &&
                comment.length >= +select_length)) ||
            fir
        ) {
            if (select_qz && comment.length < +select_length) return;
            // console.log(comment)
            Coments.push(`${fir}${comment}`);
        }
    }
    const getComment = (tr) => {
        const comment = tr.querySelector('[class*="textCollapse_content"]').textContent;
        const photos = [];
        const lis = tr.querySelectorAll('[class*="flexSmallContainer"] > img');
        lis && Array.prototype.forEach.call(lis, li => {
            photos.push(li.getAttribute('src'));
        })
        return { comment, photos };
    }
    const readComment = () => {
        const trs = document.querySelectorAll('.container--qQOSacQG ~ [data-appeared]');
        Array.prototype.forEach.call(trs, tr => {
            const $trs = tr.querySelectorAll('[class*="mainContentRoot--RVozY2ZI"]')
            if ($trs.length > 0) {
                const { comment, photos } = getComment($trs[0]);
                if (photos.length > 0) {
                    Index = Index + 1;
                    Photos.push({ id: Index, photos: photos })
                }
                addComment({ comment }, photos.length > 0 ? `有图片：${Index}：` : '')
                if ($trs.length > 1) {
                    const { comment: append_comment, photos: append_photos } = getComment($trs[1]);
                    if (append_photos.length > 0) {
                        Index = Index + 1;
                        Photos.push({ id: Index, photos: append_photos });
                    }
                    // Coments.push(append_photos.length > 0 ? `有图片：${Index}：追：${append_comment}` : `追：${append_comment}`);
                    addComment({ comment: append_comment }, append_photos.length > 0 ? `有图片：${Index}：追：` : `追：`);
                }
            }
        })
        // console.log(Coments);
        // console.log(Photos);
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
        // 进一步的去匹配
        // 比如：*0-rate.jpg_230x10000Q75.jpg_.webp
        const match2 = url.match(/^(.+?)\.(jpg|jpeg|png|gif)_\w+\.\w+\.\w+$/);
        if (match2) url = match2[1] + '.' + match2[2];

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
    function startDownload(zipD, filenameA = product_id, cb = () => { }) {
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
    function pushImg(zipD = Zip, imgArr = [], cb) {
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
    function startImagesDownload(imgArr = [], imgFolder = 'images', cb = () => { }) {
        const zip1 = new JSZip();
        pushImg(zip1, imgArr, () => {
            startDownload(zip1, imgFolder, cb)
        })
    }
    /**
     * 循环下载图片
     * @param {array} imgArr 需要下载的图片总数组 
     * @param {function} cb 下载成功后的毁掉函数
     */
    let imgIndex = 0;
    function loopImagesDownload(imgArr = [], cb = () => { }) {
        const arr = imgArr.splice(0, maxDownload);
        imgIndex++;
        startImagesDownload(arr, `${product_id}-images-${imgIndex}`, () => {
            if (imgArr.length > 0) {
                loopImagesDownload(imgArr, cb)
            } else {
                cb();
            }
        })
    }
    function download() {
        Zip.file("评价.txt", Coments.join('\r\n'));
        // Zip.file('图片.txt', JSON.stringify(Photos));
        // startDownload();
        if (!is_save_photo || Photos.length === 0) return startDownload(Zip, product_id);
        const down_photos = [];
        Photos.forEach(photo => {
            photo.photos.forEach((phot, ind) => {
                down_photos.push(getImgMin(phot, `${photo.id}-${ind}`))
            })
        })
        ImgLength = down_photos.length;
        if (ImgLength <= maxDownload) {
            pushImg(Zip, down_photos, () => {
                startDownload(Zip, product_id);
            })
        } else {
            startDownload(Zip, `${product_id}-comments`, () => {
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
    console.log('%c下载评论函数：startReadComent()', 'color:red;font-size:20px;');
    console.log('用手机页面下载评论，直接手动拖动到评论底部，出现验证码要把开发工具关掉变成电脑页面再去滑动验证，要不然不会成功');
    console.log(`window.is_save_photo=${window.is_save_photo},true保存图片，false不保存图片，可以修改当前值`)
    console.log(`小技巧，可以调整电脑的滚轮到最大，滚动的时候可以更快`)
})();