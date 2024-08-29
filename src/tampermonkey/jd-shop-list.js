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
        Array.from($table).forEach($item => {
            const $row = $item.querySelector('.goods-info-column .user-pin-cell-row');
            const jd = $row.querySelector('button~span').textContent;
            const $copy = document.createElement('span');
            $copy.style.color = 'red';
            $copy.innerHTML = '复制';
            $row.after($copy);
            $copy.addEventListener('click', e => {
                // 复制
                navigator.clipboard.writeText(jd);
                $copy.innerHTML = '已复制';
                $copy.style.color = 'gray';
            })
        })
    }, 5000);
})();