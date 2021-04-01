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
            .m-submit .txt{
                margin: 0 15px;
            }
</style>
    `)
    const $con = $('.release_content .content_inner:nth-child(5)');
    const $subCon = $('<div class="m-submit"><button>一件上传数据</button></div>');
    const $btnSub = $subCon.find('button');
    $con.prepend($subCon);
    let true_index = 0;
    let exist_index = 0;
    let error_index = 0;
    // 获取小猪数据
    const $tr_origin = $con.find('.common_table tbody tr:gt(0)');
    const tr_arr = [];
    $tr_origin.each((i,tr)=>{
        const $td = $(tr).find('td');
        const pig_create_time = new Date($td.eq(11).text().trim());
        const now_time = new Date();
        const month = pig_create_time.getMonth();
        const day = pig_create_time.getDate();
        const now_month = now_time.getMonth();
        const now_day = now_time.getDate();
        if(now_month === month && now_day-day <= 1){
            tr_arr.push(tr);
        }
    })
    const $txt = $(`<span class="txt">一共${tr_arr.length}个</span>`);
    $subCon.append($txt);
    const $err_txt = $(`<span class="err_txt"></span>`);
    $subCon.append($err_txt);
    const getTrData = (tr)=> {
        const $td = $(tr).find('td');
        const pig_id = +$td.eq(0).text();
        const task_title = $td.eq(1).text().trim();
        const type = $td.eq(2).text().trim() === '淘宝单'?1:0;
        const phone = +$td.eq(4).text().trim();
        const name = $td.eq(5).text().trim();
        const sex = $td.eq(6).text().trim() === '男'?1:$td.eq(6).text().trim() === '女'?2:0;
        const qq = $td.eq(7).text().trim();
        const price = $td.eq(8).text().trim();
        const commission = $td.eq(9).text().trim();
        const description = $td.eq(10).text().trim();
        const pig_create_time = new Date($td.eq(11).text().trim()).getTime();
        const status = $td.eq(12).find('.btn:eq(0)').text().trim() === '已完成'?1:0;
        const pig_account = 18703620195;
        const task_contact_type = 1;
        const task_contact_number = task_title.indexOf('艾：')!==-1?'314027753':'847457846';
        const shop_type = task_title.indexOf('艾：')!==-1?3:0;
        return { pig_id, task_title, type, phone, name, sex, qq, price, commission, description, pig_create_time, status, pig_account, task_contact_type, task_contact_number, shop_type };
    }
    // 添加上传按钮
    tr_arr.forEach(tr=>{
        const $this = $(tr);
        $this.find('td:last-child').append('<button class="j-alone-submit">上传</button>');
    })
    // 上传数据
    const postSub = (data)=>{
        return $.post('http://127.0.0.1:3000/api/add-person',data);
    }
    $con.on('click','.j-alone-submit',function(e){
        const $target = $(this);
        $target.val('正在上传.');
        $target.trigger('disable',true);
        const $this = $(this).closest('tr');
        const data = getTrData($this[0]);
        postSub(data).then(res=>{
            console.log(res);
            if(res.code === -1){
                layer.msg(res.message);
            }
            if(res.code === 1) {
                layer.msg('已经存在');
            }
            if(res.code === 0) {
                console.log('已上传');
            }
        })
    })
    const postSubSync = async ()=>{
        const data = [];
        for (let tr of tr_arr){
            const trData = getTrData(tr);
            data.push(trData);
            const res = await postSub(trData);
            if(res.code === -1){
                error_index++;
                $err_txt.append(`<span>${res.message}错误，</span>`);
                console.log('失败',trData.pig_id);
            }
            if(res.code === 1) {
                console.log('已经存在',trData.pig_id);
                exist_index++;
            }
            if(res.code === 0) {
                console.log('已上传',trData.pig_id)
                true_index++;
            }
            $txt.text(`一共${tr_arr.length}个，成功：${true_index}个，存在：${exist_index}个，错误：${error_index}个`);
        }
        // postSub(data);
    }
    // 一件上传
    $btnSub.on('click',function (){
        true_index =0;
        error_index = 0;
        exist_index = 0;
        $err_txt.text('');
        $btnSub.val('正在上传.');
        $btnSub.trigger('disable',true);
        postSubSync().then(res=>{
            $btnSub.val('一件上传数据.')
            $btnSub.trigger('disable', false);
        })
    })
})();
