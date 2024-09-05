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
    function createCopyBtn(){
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
    }
    setTimeout(createCopyBtn, 5000);
    function addEventListener(el, eventName, eventHandler, selector) {
        if (selector) {
            const wrappedHandler = (e) => {
                if (!e.target) return;
                // console.log(e.target);
                const el = e.target.closest(selector);
                if (el) {
                    // console.log(el);
                    eventHandler.call(el, e);
                }
            };
            el.addEventListener(eventName, wrappedHandler);
            return wrappedHandler;
        } else {
            const wrappedHandler = (e) => {
                eventHandler.call(el, e);
            };
            el.addEventListener(eventName, wrappedHandler);
            return wrappedHandler;
        }
    }
    //  右边漂浮一个按钮
    class Menu {
        constructor(btns = []) {
            this.btns = btns;
            this.init();
        }
        init() {
            const $menu = document.createElement('div');
            $menu.className = 'm-my-menu';
            $menu.innerHTML = `
            <style>
                .m-my-menu{
                    position:fixed;
                    right:0px;
                    top:40%;
                }
                .m-my-menu li{
                    list-style:none;
                    padding:5px;
                }
                .m-my-menu li a{
                    background:#f0f0f0;
                    padding:10px;
                    cursor:pointer;
                }
            </style>
            <ul>
                ${this.btns.map((btn,index) => `<li data-index="${index}"><a>${btn.name}</a></li>`).join('')}
            </ul>
            `;
            addEventListener($menu,'click',e=>{
                const $li = e.target.closest('li');
                const $index = $li.getAttribute('data-index');
                this.btns[$index].callback();
            },'li a')
            document.body.appendChild($menu);
        }
    }
    new Menu([{ name: '添加复制按钮', callback: createCopyBtn }])
})();