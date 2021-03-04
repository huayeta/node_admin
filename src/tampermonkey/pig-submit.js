// ==UserScript==
// @name         小猪平台-提交数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        http://44.73u18.cn/*
// @match        http://feifei.xi56p.cn/*
// @match        http://jiutiangw.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    $('head').append(`
        <style>
            .m-submit{
                margin-top: 20px;
                margin-bottom: -15px;
            }
</style>
    `)
    const $con = $('.release_content .content_inner:nth-child(5)');
    const $subCon = $('<div class="m-submit"><button>一件上传数据</button></div>');
    const $btnSub = $subCon.find('button');
    $con.prepend($subCon);
    // 获取小猪数据
    const $tr = $con.find('.common_table tbody tr:gt(0)');
    const getTrData = (tr)=> {
        const $td = $(tr).find('td');
        const pig_id = +$td.eq(0).text();
        const title = $td.eq(1).text().trim();
        const type = $td.eq(2).text().trim();
        const phone = $td.eq(4).text().trim();
        const name = $td.eq(5).text().trim();
        const sex = $td.eq(6).text().trim();
        const qq = $td.eq(7).text().trim();
        const price = $td.eq(8).text().trim();
        const commission = $td.eq(9).text().trim();
        const description = $td.eq(10).text().trim();
        const time = $td.eq(11).text().trim();
        const status = $td.eq(12).find('.btn:eq(0)').text().trim();
        return { id, title, type, phone, name, sex, qq, price, commission, description, time, status };
    }
    $btnSub.on('click',()=>{
        const data = [];
        $tr.each((i,tr)=>{
            const trData = getTrData(tr);
            data.push(trData);
        })
        $.post('http://127.0.0.1:3000/api/add-person',JSON.stringify(data[0]));
    })
})();
