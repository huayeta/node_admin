// ==UserScript==
// @name         抖音达人数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  计算穿透率，转化率
// @author       You
// @match        https://buyin.jinritemai.com/dashboard/servicehall/daren-profile?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jinritemai.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // 找到直播列表table
    function getLiveTable() {
        let $live;
        // 获取所有 th 元素
        var thElements = document.getElementsByTagName('th');

        // 循环遍历 th 元素
        for (var i = 0; i < thElements.length; i++) {
            // 检查 th 元素的文本内容是否包含"直播信息"
            if (thElements[i].textContent === '直播信息') {
                // 在这里可以对符合条件的 th 元素进行操作，比如修改样式等
                // thElements[i].style.color = 'red';
                const $table = thElements[i].closest('table');
                if ($table) $live = $table;
            }
        }
        return $live;
    }
    // 建立菜单
    function createMenu() {
        const $menu = document.createElement('div');
        $menu.className = 'm-my-menu';
        $menu.innerHTML = `
        <style>
            .m-my-menu{
                position:fixed;
                right:0px;
                top:40%;
            }
        </style>
        <ul>
            <li><a class="live">更新直播列表</a><li>
        </ul>
        `;
        document.body.appendChild($menu);
        return $menu;
    }
    // 转换成数字
    function convertNum(str, sign) {
        console.log(str, sign, sign.trim() == '万')
        let result = str + sign;
        if (sign === '') {
            result = +(str.replace(/,/g, ''));
        } else if (sign.trim() == '万') {
            result = +(str.replace(/,/g, '')) * 10000;
        }
        return Math.round(result);
    }
    // 转换成百分数
    function convertToPercentage(num, decimalPlaces) {
        return (num * 100).toFixed(decimalPlaces) + '%';
    }
    // 添加穿透率
    function addRateHTML(penetration,rate,$ele){
        const $span = document.createElement('span');
        $span.innerHTML = `穿透率：${penetration}，转化率：${rate}`;
        $ele.appendChild($span);
    }
    // 初始化每个tr
    function modifyTr($tr) {
        // 曝光次数
        const exposure_num = convertNum($tr.querySelector('td.auxo-table-cell:nth-child(2) .num').textContent, $tr.querySelector('td.auxo-table-cell:nth-child(2) .sign').textContent);
        // 观看人数
        const view_num = convertNum($tr.querySelector('td.auxo-table-cell:nth-child(3) .num .num').textContent, $tr.querySelector('td.auxo-table-cell:nth-child(3) .num .sign').textContent);
        // 成交人数
        const deal_num = convertNum($tr.querySelector('td.auxo-table-cell:nth-child(4) .num').textContent, $tr.querySelector('td.auxo-table-cell:nth-child(4) .sign').textContent);
        // 穿透率
        const penetration = convertToPercentage(view_num / exposure_num,2);
        // 转化率
        const rate = convertToPercentage(deal_num / view_num,2);
        console.log(exposure_num, view_num, deal_num, penetration, rate);
        const $span = document.createElement('span');
        $span.style = 'color:red;vertical-align:super;';
        $tr.querySelector('td.auxo-table-cell:nth-child(3)').appendChild($span);
        // 添加穿透率和转化率html
        addRateHTML(penetration,rate,$span);
    }
    const $menu = createMenu();
    const $liveMenu = $menu.querySelector('.live');
    $liveMenu.addEventListener('click', () => {
        const $live = getLiveTable();
        const $trs = $live.querySelectorAll('tbody.auxo-table-tbody>tr');
        Array.from($trs).forEach(($tr) => {
            modifyTr($tr);
        })
    }, false)
    // Your code here...
    console.log('直播间曝光人数，观看人数，成交人数来计算转头率，转化率');
})();