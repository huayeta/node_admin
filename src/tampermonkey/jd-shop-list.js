// ==UserScript==
// @name         京东出库列表复制京东号
// @namespace    http://tampermonkey.net/
// @version      2024-08-28
// @description  try to take over the world!
// @author       You
// @match        https://shop.jd.com/jdm/trade/order/orderList*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jd.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    setTimeout(() => {
        const $table = document.querySelectorAll('.table-item-container');
        function copyToClipboard(text) {
            const domIpt = document.createElement('textarea');
            domIpt.style.position = 'absolute';
            domIpt.style.left = '-9999px';
            domIpt.style.top = '-9999px';
            document.body.appendChild(domIpt);
            domIpt.value = text;
            domIpt.select();
            document.execCommand('copy');
            document.body.removeChild(domIpt);
        }
        Array.from($table).forEach($item => {
            const $row = $item.querySelector('.goods-info-column .user-pin-cell-row');
            const jd = $row.querySelector('button~span').textContent;
            const $copy = document.createElement('span');
            $copy.style.color='red';
            $copy.innerHTML = '复制';
            $row.after($copy);
            $copy.addEventListener('click', e => {
                copyToClipboard(jd);
                $copy.innerHTML = '已复制';
                $copy.style.color = 'gray';
            })
        })
    }, 6000);
})();