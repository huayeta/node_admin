// ==UserScript==
// @name         天猫-提交数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        https://trade.taobao.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    // 获取列表
    const Items_origin = document.querySelectorAll('.trade-order-main');
    const Items = Array.prototype.filter.call(Items_origin,item=>{
        // 获取旗帜
        const flag = item.querySelector('#flag');
        const flag_style = flag.querySelector('i').getAttribute('style');
        const flag_is_blue = flag_style.includes('-60px -207px');
        return flag_is_blue;
    });
    const getItemData = item => {
        // 获取账号
        const account = item.querySelector('a[class^=buyer-mod__name]')
            .innerText;
        // 获取订单号跟创建时间
        const label = item.querySelector('label[class^=item-mod__checkbox-label]').innerText;
        const label_arr = /订单号:\D+?(\d+)创建时间:\D+?(.+)/.exec(label);
        const order_id = label_arr[1].trim();
        const create_time = label_arr[2].trim();
        return { account, order_id, create_time };
    };
    const Datas = Items.map(getItemData);
    console.log(Datas);
})();
