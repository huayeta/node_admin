// ==UserScript==
// @name         生意参谋参数转化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  生意参谋参数转化，配合小旺神
// @author       You
// @match        https://sycm.taobao.com/mc/mq/search_analyze?*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    const myFetch = (number, cb) => {
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
        $trs.forEach(($tr, index) => {
            // 搜索的人
            const ss = $tr.querySelector('td:nth-child(3)');
            // 点击人数
            const rq = $tr.querySelector('td:nth-child(6)');
            // 交易金额
            const jy = $tr.querySelector('td:nth-child(8)');
            // 支付转化率
            const zh = $tr.querySelector('td:nth-child(9)');
            // 在线商品数
            const zxsp = $tr.querySelector('td:nth-child(10)').textContent.replace(/,/g, '');
            // 转换搜索人数指数
            myFetch(ss.textContent, ssrs => {
                const $span = document.createElement('span');
                $span.style = 'color:red;';
                $span.textContent = `-搜索人数：${ssrs}`;
                ss.querySelector('.cell span').appendChild($span);
                // 转换点击人数指数
                myFetch(rq.textContent, rs => {
                    const $span = document.createElement('span');
                    $span.style = 'color:red;';
                    $span.textContent = `-点进来人：${rs}`;
                    rq.querySelector('.cell span').appendChild($span);
                    // 转换交易金额指数
                    myFetch(jy.textContent, res => {
                        // 计算出具体的支付人数
                        const num = (parseFloat(rs) * parseFloat(zh.textContent.replace("%", "")) / 100).toFixed(0);
                        // 计算商品竞争度
                        const jzd = (zxsp/ssrs*100).toFixed(2);

                        const $span = document.createElement('span');
                        $span.style = 'color:red;';
                        $span.textContent = `-交易金额：${res}，支付人数：${num}，商品竞争度：${jzd}`;
                        jy.querySelector('.cell span').appendChild($span);
                    })
                })
            })
        })
    }, false)
})();
