// ==UserScript==
// @name         生意参谋参数转化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  生意参谋参数转化
// @author       You
// @match        https://sycm.taobao.com/mc/mq/search_analyze?*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    const myFetch = (number,cb) => {
        const url = 'https://www.diantoushi.com/switch/v2/change';
        const data = { 
            "categoryId": "", 
            "changeType": "2", 
            "indexTrans": "[{\"num\":1,\"tradeIndex\":\"" + number + "\"}]" 
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(data => {
                console.log('服务器响应：', data);
                const result = data.data[0].tradeIndexChange;
                // alert(result);
                cb(result);
            })
            .catch(error => {
                console.error('请求出错：', error);
            });
    }
    // myFetch(22311);
    // 建立菜单
    function createMenu() {
        const $menu = document.createElement('div');
        $menu.className = 'm-my-menu';
        $menu.innerHTML = `
        <style>
            .m-my-menu{
                position:fixed;
                right:20px;
                top:9%;
                z-index:10000000000;
                font-size:18px;
            }
        </style>
        <ul>
            <li><a class="live">更新指数参数</a><li>
        </ul>
        `;
        document.body.appendChild($menu);
        return $menu;
    }
    const $menu = createMenu();
    const $liveMenu = $menu.querySelector('.live');
    $liveMenu.addEventListener('click', () => {
        const $trs = document.querySelectorAll('.el-table__row');
        $trs.forEach(($tr,index)=>{
            const rq = $tr.querySelector('td:nth-child(6)');
            const jy = $tr.querySelector('td:nth-child(8)');
            myFetch(rq.textContent,res=>{
                const $span = document.createElement('span');
                $span.style = 'color:red;';
                $span.textContent = `-${res}`;
                rq.querySelector('.cell span').appendChild($span);
            })
            myFetch(jy.textContent,res=>{
                const $span = document.createElement('span');
                $span.style = 'color:red;';
                $span.textContent = `-${res}`;
                jy.querySelector('.cell span').appendChild($span);
            })
        })
    }, false)
})();
