// ==UserScript==
// @name         小猪平台-汇总数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        http://ewr.btyy.vip/home/member/fangdan.html
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    // {
    //     phone：[
    //         { pig_id, pig_phone, pig_qq, pig_register_time, pig_over_time }
    //     ]
    // }
    // 获取已完成小猪数据
    const DATA = localStorage.getItem('completeOrders')?JSON.parse(localStorage.getItem('completeOrders')):{};
    const storageData =()=>{
        localStorage.setItem('completeOrders',JSON.stringify(DATA));
    }
    // 获得每个tr数据
    const getTrData = ($tr) => {
        // console.log($tr);
        const pig_id = $tr.querySelector('td:nth-child(1)').textContent;
        const pig_phone = $tr.querySelector('td:nth-child(5)').textContent;
        const pig_qq = $tr.querySelector('td:nth-child(9)').textContent;
        const pig_register_time = $tr.querySelector('td:nth-child(10)').textContent;
        const pig_over_time = $tr.querySelector('td:nth-child(14)').textContent;
        return { pig_id, pig_phone, pig_qq, pig_register_time, pig_over_time };
    }
    const getData = () => {
        const $con = document.querySelector('.release_content .content_inner:nth-child(5)');
        const $trs = $con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');
        // console.log($trs);
        // console.log(getTrData($trs[0]))
        if (!$trs) true;
        const length = 100 || $trs.length-1;
        for(let i = length;i--;i>=0){
            const $tr = $trs[i];
            const trData = getTrData($tr);
            // DATA.push(getTrData($tr));
            if(!DATA[trData.pig_phone]){
                DATA[trData.pig_phone]=[trData];
            }else{
                if(DATA[trData.pig_phone].find(data=>data.pig_id==trData.pig_id))continue;
                DATA[trData.pig_phone].unshift(trData);
            }
        }
        storageData();
    }
    getData();
    // const DATA = getData();
    // const DATA = {
    //     '18829904058':[
    //         {
    //             "pig_id": "4669667",
    //             "pig_phone": "18829904058",
    //             "pig_qq": "1576630003",
    //             "pig_register_time": "2022-02-19 14:22:33",
    //             "pig_over_time": "2022-09-05 13:31:20"
    //         },
    //         {
    //             "pig_id": "4669667222",
    //             "pig_phone": "18829904058",
    //             "pig_qq": "223444",
    //             "pig_register_time": "2022-02-14 14:22:33",
    //             "pig_over_time": "2022-09-02 13:31:20"
    //         }
    //     ]
    // }
//   下载函数
    const Download = ()=>{
        const blob = new Blob([JSON.stringify(DATA)],{
            type:'text/plain;charset=utf-8'
        });
        const src = window.URL.createObjectURL(blob);
        if(!src)return;
        const link = document.createElement('a');
        link.style.display='none';
        link.href = src;
        link.setAttribute('download',`小猪数据${new Date().toLocaleDateString()}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blob);
    }
    if(localStorage.getItem('downloadTime')){
        if((new Date().getTime()-7*24*60*60*1000)>new Date(localStorage.getItem('downloadTime')).getTime()){
            Download();
        }
    }else{
        Download();
        localStorage.setItem('downloadTime',new Date().toLocaleString());
    }
    // 找到phone数据里面的不同qq数组
    const findQqs = (datas,qq) => {
        const arr = [];
        datas.forEach(data => {
            if (data.pig_qq!=qq && !arr.includes(data.pig_qq)) {
                arr.push(data.pig_qq);
            }
        })
        return arr;
    }
    // console.log(findQqs(
    //     [
    //         {
    //             "pig_id": "4733955",
    //             "pig_phone": "13001576502",
    //             "pig_qq": "2752648533",
    //             "pig_register_time": "2020-05-21 17:35:50",
    //             "pig_over_time": "2022-09-26 08:34:00"
    //         },
    //         {
    //             "pig_id": "4686271",
    //             "pig_phone": "13001576502",
    //             "pig_qq": "222",
    //             "pig_register_time": "2020-05-21 17:35:50",
    //             "pig_over_time": "2022-09-08 17:52:19"
    //         },
    //         {
    //             "pig_id": "4686271",
    //             "pig_phone": "13001576502",
    //             "pig_qq": "222",
    //             "pig_register_time": "2020-05-21 17:35:50",
    //             "pig_over_time": "2022-09-08 17:52:19"
    //         }
    //     ],"2752648533"
    // ));
    // 格式化等待完成的数据
    const formatPendingTr = ($tr) => {
        const $phone = $tr.querySelector('td:nth-child(5)');
        const phone = $phone.textContent;
        const $qq = $tr.querySelector('td:nth-child(8)');
        const qq = $qq.textContent;
        const Datas = DATA[phone];
        // console.log(phone,qq);
        if(!Datas)return;
        // console.log(DATA[phone],qq);
        const Qqs = findQqs(Datas,qq);
        // console.log(Qqs);
        // console.log(arr);
        // 如果有不一样的qq号
        if (Qqs.length > 0) {
            const qqDiv = document.createElement('div');
            qqDiv.style = 'color:red;';
            qqDiv.innerHTML = `有不同的qq号：${Qqs.join('，')}`;
            $qq.append(qqDiv);
        }
        // 标注已做单数量
        const $completeTr = $tr.querySelector('td:nth-child(6)');
        const div = document.createElement('div');
        div.style = 'color:red;';
        div.innerHTML = `已做单:${Datas.length}`;
        $completeTr.append(div);
        // 最近做单日期
        const $registrTr = $tr.querySelector('td:nth-child(14)');
        const $lately = document.createElement('div');
        $lately.style = 'color:red;';
        $lately.innerHTML = `最近做单日期:${Datas[0].pig_over_time}`;
        $registrTr.append($lately);
    }
    const startFormatPendingCon = () => {
        const $PendingCon = document.querySelector('.release_content .content_inner:nth-child(2)');
        const $PendingTrs = $PendingCon.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');
        // // 添加不同qq
        const qqAdd = document.createElement('div');
        qqAdd.className="search";
        qqAdd.style='display:flex;';
        qqAdd.innerHTML=`<input class="search_input phone" placeholder="会员手机号" /><input class="search_input qq" placeholder="qq号" /><button class="search_btn add">添加不同qq</button>`;
        $PendingCon.prepend(qqAdd);
        qqAdd.querySelector('.add').addEventListener('click',(e)=>{
            const qq = qqAdd.querySelector('.qq').value;
            const phone = qqAdd.querySelector('.phone').value;
            // console.log(qq,phone);
            if(!DATA[phone])DATA[phone]=[];
            DATA[phone].push({
                pig_phone:phone,
                pig_qq:qq,
            })
            storageData();
            location.reload();
        },false)
        if (!$PendingTrs) return;
        // console.log(DATA);
        Array.prototype.forEach.call($PendingTrs, ($tr, index) => {
            formatPendingTr($tr);
        })
        // formatPendingTr($PendingTrs[0]);
    }
    startFormatPendingCon();
    // console.log($PendingTrs);

})();
