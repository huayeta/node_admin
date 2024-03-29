// ==UserScript==
// @name         小猪平台-无限置顶
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  无限置顶小猪任务
// @author       You
// @match        http://116.63.136.65/home/member/my_wallet.html
// @match        http://116.63.136.65/home/member/fangdan.html
// @match        http://116.63.136.65/home/cash/cardlist_uncheck.html
// @match        http://www.mypig.com/home/member/my_wallet.html
// @match        http://www.mypig.com/home/member/fangdan.html
// @match        http://www.mypig.com/home/cash/cardlist_uncheck.html
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var $span = $('span[onclick^="isPtTop"]');
    const pt_top_zuanshi = $('#pt_top_zuanshi').text();
    const span_length = $span.length;
    const time = 1000000;
    const ptGood = goods_id => {
        var url = '/home/member/ispttop.html';
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                $.ajax({
                    url: url,
                    type: 'post',
                    data: { goods_id: goods_id },
                    cache: false,
                    dataType: 'json',
                    success: function(result) {
                        return resolve();
                        if (result.code == '0') {
                            resolve(result);
                            // layer.msg(result.msg, {
                            //     time: 1000,
                            //     end: function() {
                            //         location.reload();
                            //     }
                            // });
                        } else {
                            reject(result);
                            // layer.msg(result.msg, {
                            //     anim: 6,
                            //     end: function() {
                            //         location.reload();
                            //     }
                            // });
                        }
                    }
                });
            }, time);
        });
    };
    const spanPtGood = async span => {
        const str = span.attr('onclick');
        const arr = /isPtTop\('(\d+)'/.exec(str);
        if (arr) {
            const goods_id = arr[1];
            // console.log(goods_id);
            await ptGood(goods_id);
        }
        console.log(str);
    };
    const ajaxSpanLength = async (length) =>{
        if(span_length >0  && (pt_top_zuanshi === '' || +pt_top_zuanshi === 0)){
            const num = (span_length > length ? length : span_length);
            const arr = [];
            for(let i = 0; i < num; i++){
                arr.push(spanPtGood($span.eq(i)));
            }
            await Promise.all(arr);
            location.reload();
        }else{
            setTimeout(() => {
                location.reload();
            }, time);
        }
    }
    ajaxSpanLength(span_length>=3?3:span_length);
    // if (span_length > 0 && (pt_top_zuanshi === '' || +pt_top_zuanshi === 0)) {
    //     if (span_length >= 2) {
    //         let index = 1;
    //         spanPtGood($span.eq(0)).then(() => {
    //             index++;
    //             if (index === 2) location.reload();
    //         });
    //         spanPtGood($span.eq(1)).then(() => {
    //             index++;
    //             if (index === 2) location.reload();
    //         });
    //     } else {
    //         spanPtGood($span.eq(0)).then(() => {
    //             location.reload();
    //         });
    //     }
    // }
    // Your code here...
})();
