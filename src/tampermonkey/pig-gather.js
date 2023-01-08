// ==UserScript==
// @name         小猪平台-汇总数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  汇总数据，并持久化保存，1周自动下载一次
// @author       You
// @match        http://sde.meiduoduo.xyz/home/member/fangdan.html
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    // {
    //     phone：[
    //         {pig_phone,pig_qq?,qq_exec_pre,pig_over_time} 添加做单记录            
    //         {pig_phone,pig_note} 添加备注
    //         {pig_phone,pig_qq} 添加不同的qq
    //         { pig_id, pig_phone, pig_qq, pig_register_time, pig_over_time, qq_exec_pre? } 正常小猪单
    //     ]
    // }
    // 获取已完成小猪数据
    const DATA = localStorage.getItem('completeOrders') ? JSON.parse(localStorage.getItem('completeOrders')) : {};
    const QQS = {
        '31': '小艾-1',
        '30': '小欣-2',
        '20': '小云-3',
        '54': '小韵-4',
        '21': '小菜菜'
    }
    const storageData = () => {
        localStorage.setItem('completeOrders', JSON.stringify(DATA));
    }
    // 获得每个tr数据
    const getTrData = ($tr) => {
        // console.log($tr);
        const pig_id = $tr.querySelector('td:nth-child(1)').textContent;
        const pig_title = $tr.querySelector('td:nth-child(2)').textContent;
        const pig_phone = trim($tr.querySelector('td:nth-child(5)').textContent);
        const pig_qq = trim($tr.querySelector('td:nth-child(9)').textContent);
        const pig_register_time = $tr.querySelector('td:nth-child(10)').textContent;
        const pig_over_time = $tr.querySelector('td:nth-child(14)').textContent;

        let result = { pig_id, pig_phone, pig_qq, pig_over_time, pig_register_time };
        let arr = /^.&.，(\d+?)\：/.exec(pig_title);
        if (arr) {
            result.qq_exec_pre = arr[1];
        }
        return result;
    }
    const getData = () => {
        const $con = document.querySelector('.release_content .content_inner:nth-child(5)');
        const $trs = $con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');
        // console.log($trs);
        // console.log(getTrData($trs[0]))
        if (!$trs) true;
        //如果DATA是一个空对象就全部循环了
        const length = JSON.stringify(DATA).length == 2 ? $trs.length - 1 : 100;
        for (let i = length; i--; i >= 0) {
            const $tr = $trs[i];
            const trData = getTrData($tr);
            // DATA.push(getTrData($tr));
            if (!DATA[trData.pig_phone]) {
                DATA[trData.pig_phone] = [trData];
            } else {
                const index = DATA[trData.pig_phone].findIndex(data => data.pig_id == trData.pig_id)
                if (index != -1) {
                    if (!DATA[trData.pig_phone][index].qq_exec_pre && trData.qq_exec_pre) DATA[trData.pig_phone][index].qq_exec_pre = trData.qq_exec_pre;
                    continue;
                }
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
    const MDownload = (data, name) => {
        const blob = new Blob(data, {
            type: 'text/plain;charset=utf-8'
        });
        const src = window.URL.createObjectURL(blob);
        if (!src) return;
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = src;
        link.setAttribute('download', `${name}${new Date().toLocaleDateString()}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blob);
    }
    // MDownload([1],'2');
    const Download = () => {
        const data = {
            completeOrders: DATA,
            notes: localStorage.getItem('notes'),
            downloadTime: localStorage.getItem('downloadTime')
        }
        MDownload([JSON.stringify(data)], '小猪数据');
        localStorage.setItem('downloadTime', new Date().toLocaleString());
    }
    if (localStorage.getItem('downloadTime')) {
        if ((new Date().getTime() - 7 * 24 * 60 * 60 * 1000) > new Date(localStorage.getItem('downloadTime')).getTime()) {
            Download();
        }
    } else {
        Download();

    }
    // 找到phone数据里面的不同qq数组
    const findQqs = (datas, qq) => {
        const arr = [];
        datas.forEach(data => {
            if (data.pig_qq && data.pig_qq != qq && !arr.includes(data.pig_qq)) {
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
    // 找到phone数据里面的note数据
    const findNotes = (datas) => {
        const arr = [];
        datas.forEach(data => {
            if (data.pig_note) arr.push(data.pig_note);
        })
        return arr;
    }
    // 格式化等待完成的数据
    // 格式化phones的记录数据
    const formatePhoneDatas = Datas => {
        return Datas.filter(data => data.pig_over_time);
    }
    // 人性化的做单记录数据
    const humanDatas = datas =>{
        // 备注数据
        let notes = findNotes(datas);
        // 做单数据
        let records = formatePhoneDatas(datas);
        // 找到所有的qq号
        let qqs = findQqs(datas,'1');
        return{
            phone: datas[0].pig_phone,
            qqs:qqs,
            record_num: records.length,
            notes:notes,
            record_time: records.length>0 && records[0].pig_over_time,
            record_qq: records.length>0 && QQS[records[0].qq_exec_pre],
        }
    }
    function trim(str){
        if(!str)return str;
        str = str.replace(/\ +/g,'');
        str = str.replace(/[\r\n\t]/g,'');
        str = str.trim();
        return str;
    }
    const formatTr = ($tr, phone_index = 5, qq_index = 8, date_index = 14, type) => {
        // console.log($tr);
        const $phone = $tr.querySelector(`td:nth-child(${phone_index})`);
        const phone = trim($phone.textContent);
        const $qq = $tr.querySelector(`td:nth-child(${qq_index})`);
        const qq = trim($qq.textContent);
        // console.log(phone, qq);
        // console.log(Datas);
        // 如果不存在就返回
        if (!DATA[phone]) {

            // 如果type==2，等待完成列表
            if (type == 2 || true) {
                const Div = document.createElement('div');
                Div.className = 'search';
                Div.style = 'margin-top: 10px;'
                Div.innerHTML = `
            <button class="search_btn j-btn">添加记录</button>
            `;
                $phone.append(Div);
                const $btn = Div.querySelector('.j-btn');
                $btn.addEventListener('click', e => {
                    DATA[phone] = [];
                    storageData();
                    alert('添加记录成功~')
                }, false)
            }

            return;
        }
        const Datas = formatePhoneDatas(DATA[phone]);
        // console.log(DATA[phone], qq);
        const Qqs = findQqs(DATA[phone], qq);
        // console.log(Qqs);
        // console.log(arr);
        // 如果有不一样的qq号
        if (Qqs.length > 0) {
            const qqDiv = document.createElement('div');
            qqDiv.style = 'color:red;';
            qqDiv.innerHTML = `有不同的qq号：${Qqs.map(qq => `<p>${qq}</p>`).join('')}`;
            $qq.append(qqDiv);
        }
        // 标注是否有多个手机号
        if(qq=='1451603208' && type==2 || true){
            let phones_arr = findPhonesByQq(qq);
            if(phones_arr.length>0 || true){
                if(Qqs.length>0){
                    Qqs.forEach(qq=>{
                        // console.log(findPhonesByQq(qq))
                        phones_arr=phones_arr.concat(findPhonesByQq(qq))
                    });
                }
                // console.log(phones_arr);
                // 去重
                phones_arr = [...new Set(phones_arr)];
                // console.log(phones_arr);
                // 去除自身phone
                phones_arr = phones_arr.filter(phone_tmp=>phone_tmp!=phone);
                // console.log(phones_arr);
                if(phones_arr.length>0){
                    // console.log(`插入${JSON.stringify(phones_arr)}`)
                    const Div = document.createElement('div');
                    Div.style = 'color:blueviolet;';
                    let str = phones_arr.reduce((a,b)=>{
                        const Datas = formatePhoneDatas(DATA[b]);
                        if(Datas.length==0){
                            return a+`<p>${b}，<br/>已做单：${Datas.length}`;
                        }
                        return a+`<p>${b}，<br/>已做单：${Datas.length}，<br/>最近做单日期：${Datas[0].pig_over_time}，<br/>最近做单qq：${QQS[Datas[0].qq_exec_pre]}</p>`
                    },'')
                    Div.innerHTML = `有不同的手机号：${str}`;
                    $phone.append(Div);
                }        
                // console.log('11111111111111')
            }
        }
        
        // 标注备注信息
        const Notes = findNotes(DATA[phone]);
        if (Notes.length > 0) {
            const Div = document.createElement('div');
            Div.style = 'color:#1000ff;';
            Div.innerHTML = `备注：${Notes.join('，')}`;
            $qq.append(Div);
        }
        // 如果没有记录就返回
        if (Datas.length == 0) {

            // 格式化注册时间到现在多久了

            return;
        }
        // 标注已做单数量
        const $completeTr = $tr.querySelector('td:nth-child(6)');
        const div = document.createElement('div');
        div.style = 'color:red;';
        div.innerHTML = `已做单:${Datas.length}`;
        $completeTr.append(div);
        // 最近做单日期
        const $registrTr = $tr.querySelector(`td:nth-child(${date_index})`);
        const $lately = document.createElement('div');
        $lately.style = 'color:red;';
        let latelyStr = `<p>最近做单日期:${Datas[0].pig_over_time}</p>`;
        if (Datas[0].qq_exec_pre) latelyStr += `<P>最近做单qq：${QQS[Datas[0].qq_exec_pre]}</P>`;
        $lately.innerHTML = latelyStr;
        $registrTr.append($lately);
    }
    // 等待完成格式化tr
    const startFormatPendingCon = () => {
        const $PendingCon = document.querySelector('.release_content .content_inner:nth-child(2)');
        const $PendingTrs = $PendingCon.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');

        if (!$PendingTrs) return;
        // console.log(DATA);
        Array.prototype.forEach.call($PendingTrs, ($tr, index) => {
            formatTr($tr, 5, 8, 14, 2);
        })
        // formatPendingTr($PendingTrs[0]);
    }
    startFormatPendingCon();
    // 等待审核格式化tr
    const startFormatAuditingCon = () => {
        const $Con = document.querySelector('.release_content .content_inner:nth-child(3)');
        const $Trs = $Con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');

        if (!$Trs) return;
        // console.log($Trs);
        Array.prototype.forEach.call($Trs, ($tr, index) => {
            formatTr($tr, 6, 9);
        })
    }
    startFormatAuditingCon();
    // 已完成格式化前100tr
    const startFormatCompleteCon = () => {
        const $Con = document.querySelector('.release_content .content_inner:nth-child(5)');
        const $Trs = $Con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');

        if (!$Trs) return;
        // console.log(DATA);
        Array.prototype.forEach.call($Trs, ($tr, index) => {
            if (true || index < 100) formatTr($tr, 5, 9);
        })
    }
    startFormatCompleteCon();
    // 已取消格式化前100tr
    const startFormatCancelCon = () => {
        const $Con = document.querySelector('.release_content .content_inner:nth-child(6)');
        const $Trs = $Con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');

        if (!$Trs) return;
        // console.log(DATA);
        Array.prototype.forEach.call($Trs, ($tr, index) => {
            if (index < 100) formatTr($tr, 5, 7, 12);
        })
    }
    startFormatCancelCon();
    // 添加不同qq，用户备注，网页备注
    const AddQQDiv = () => {
        const qqAdd = document.createElement('div');
        let option_strs = '';
        Object.keys(QQS).forEach(num => {
            option_strs += `<option value=${num}>${QQS[num]}</option>`;
        })
        qqAdd.innerHTML = `
            <div class="">
                <div class="search m-search">
                    <style>
                        .m-search{
                            display:flex; align-items:center; height:auto; margin-top:15px;
                        }
                        .m-search .search_input{width:150px;}
                    </style>
                    <div>
                        <div style="margin-bottom:10px;"><input class="search_input phone" placeholder="通过会员手机号" /></div>
                        <div><input class="search_input byqq" placeholder="通过会员qq" /></div>
                    </div>
                    <div style="margin-left:10px; margin-right:20px;">
                        <div style="margin-bottom:10px;"><input class="search_input qq" placeholder="qq号" /><button class="search_btn add">添加不同qq</button><button class="search_btn del" style="background:red;margin-left:15px;">删除qq</button></div>
                        <div><input class="search_input note" placeholder="用户备注" /><button class="search_btn add-note">添加备注</button><button class="search_btn del-note" style="background:red;margin-left:15px;">删除备注</button></div>
                    </div>
                    <div>
                        <div style="margin-bottom: 10px;"><input class="search_input gnote" placeholder="网页备注" /><button class="search_btn add-gnote">添加网页备注</button></div>
                        <div><select class="search_input qq_exec_pre" style="width:190px;">${option_strs}</select><button class="search_btn add-record">添加做单记录</button></div>    
                    </div>
                </div>
                <div class="btns">
                    <style>
                        .m-findDate{
                            display:flex;
                            margin-top:15px;
                        }
                        .u-con p{
                            line-height: 1.5;
                        }
                    </style>
                    <div class="m-findData search">
                        <button class="search_btn j-findPhoneBtn" style="width:auto;padding: 0 10px;">查询phone做单数据</button>
                        <button class="search_btn j-findQqBtn" style="background:rebeccapurple;width:auto;padding: 0 10px;">查询qq做单数据</button>
                        <button class="search_btn j-findQqs" style="width:auto;padding: 0 10px; margin-left: 10px;">查询不同的qq</button>
                        <button class="search_btn download" style="background:rebeccapurple;margin-left:10px;">下载数据</button>
                        <button class="search_btn j-gatherQqs" style="width:auto;padding: 0 10px; margin-left: 10px;">筛选qq</button>
                        <span style="color:darkmagenta; margin-left:10p;">${JSON.stringify(QQS)}</span>
                    </div>
                    <div class="u-con">
                        <!-- <table class="common_table">
                            <tbody>
                                <tr>
                                    <th>手机号</th>
                                    <th>全部qq号</th>
                                    <th>已做单数量</th>
                                    <th>备注</th>
                                    <th>最近做单日期</th>
                                    <th>最近做单qq号</th>
                                </tr>
                                <tr>
                                    <td>
                                        <p>18711111111</p>
                                        <p>有多个手机号</p>
                                    </td>
                                    <td style="color: blueviolet;">
                                        <p>8282828282</p>
                                        <p>223221223</p>
                                    </td>
                                    <td style="color:red;">10</td>
                                    <td style="color: rgb(16, 0, 255);">
                                        <p>账号被抓</p>
                                    </td>
                                    <td style="color:red;">2022-12-29 15:49:48</td>
                                    <td>小韵-4</td>
                                </tr>
                            </tbody>
                        </table> -->
                    </div>
                </div>
            </div>
        `;
        document.querySelector('.release_tab').before(qqAdd);
        const $phone = qqAdd.querySelector('.phone');
        const $byQQ = qqAdd.querySelector('.byqq');
        // 不同qq查找到手机号
        qqAdd.querySelector('.byqq').addEventListener('input', e => {
            const qq = $byQQ.value;
            const datas = findDatasByQq(qq);
            // console.log(datas);
            if (datas.length > 0) {
                if (datas.length === 1) {
                    $phone.value = datas[0][0].pig_phone;
                } else {
                    $phone.value = '有多个手机号';
                }
            } else {
                $phone.value = '';
            }

        })
        // 添加qq
        qqAdd.querySelector('.add').addEventListener('click', (e) => {
            const qq = qqAdd.querySelector('.qq').value;
            const phone = $phone.value;
            // console.log(qq,phone);
            if(!phone)return alert('手机号不能为空');
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return;
                // DATA[phone] = [];
            }
            if(!qq){
                alert('qq不能为空')
                return;
            }
            DATA[phone].push({
                pig_phone: phone,
                pig_qq: qq,
            })
            storageData();
            alert('qq添加成功');
            location.reload();
        }, false)
        // 删除qq
        qqAdd.querySelector('.del').addEventListener('click', e => {
            const qq = qqAdd.querySelector('.qq').value;
            const phone = $phone.value;
            if (confirm('确定删除吗？')) {
                if (!DATA[phone]) {
                    alert('找不到对应的记录~')
                    return;
                    // DATA[phone] = [];
                }
                const datas = DATA[phone].filter(data => data.pig_id || data.pig_qq != qq);
                // console.log(datas);
                DATA[phone] = datas;
                storageData();
                alert('qq删除成功');
                location.reload();
            }
        }, false)
        // 添加备注
        qqAdd.querySelector('.add-note').addEventListener('click', (e) => {
            const note = qqAdd.querySelector('.note').value;
            const phone = $phone.value;
             if(!phone)return alert('手机号不能为空');
            // console.log(qq,phone);
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return;
                // DATA[phone] = [];
            }
            if(!note){
                alert('note不能为空')
                return;
            }
            DATA[phone].push({
                pig_phone: phone,
                pig_note: note,
            })
            storageData();
            alert('备注添加成功');
            location.reload();
        }, false)
        // 删除备注
        qqAdd.querySelector('.del-note').addEventListener('click', e => {
            const note = qqAdd.querySelector('.note').value;
            const phone = $phone.value;
            if (confirm('确定删除吗？')) {
                if (!DATA[phone]) {
                    alert('找不到对应的记录~')
                    return;
                    // DATA[phone] = [];
                }
                const datas = DATA[phone].filter(data => data.pig_note != note);
                // console.log(datas);
                DATA[phone] = datas;
                storageData();
                alert('备注删除成功');
                location.reload();
            }
        }, false)
        // 添加网页备注
        qqAdd.querySelector('.add-gnote').addEventListener('click', (e) => {
            const gnote = qqAdd.querySelector('.gnote').value;
            if (!gnote) return;
            const notes = localStorage.getItem('notes') ? JSON.parse(localStorage.getItem('notes')) : [];
            notes.push(gnote);
            localStorage.setItem('notes', JSON.stringify(notes));
            alert('备注网页添加成功');
            location.reload();
        }, false)
        // 添加做单记录
        qqAdd.querySelector('.add-record').addEventListener('click', e => {
            const phone = $phone.value;
            const qq = $byQQ.value;
            const qq_exec_pre = qqAdd.querySelector('.qq_exec_pre').value;
            const record = { pig_phone: phone,pig_qq: qq, pig_over_time: new Date().toLocaleString(), qq_exec_pre: qq_exec_pre };
            if (!DATA[phone]) {
                alert('找不到对应的phone记录~')
                return;
                // DATA[phone] = [];
            }
            if(!qq){
                alert('qq不能为空~');
                return;
            }
            // setCon([record])
            DATA[phone].unshift(record);
            storageData();
            alert('添加做单记录成功');
            location.reload();
        }, false)
        // 设置显示内容 
        const $btns = qqAdd.querySelector('.btns');
        const $con = $btns.querySelector('.u-con');
        const setCon = arr => {
            let str = '';
            if (arr.length > 0) {
                arr.forEach(date => {
                    str += `<div>${typeof date ==='string'?date:JSON.stringify(date)}</div>`;
                })
            }
            $con.innerHTML = str;
        }
        // 下载按钮
        $btns.querySelector('.download').addEventListener('click', (e) => {
            Download();
        }, false)
        // phone查询做单记录
        $btns.querySelector('.j-findPhoneBtn').addEventListener('click', (e) => {
            const phone = $phone.value;
            if (phone && DATA[phone]) {
                // console.log(DATA[phone]);
                // alert(JSON.stringify(DATA[phone]));
                setCon(DATA[phone]);
            } else {
                // alert('没找到记录');
                setCon(['没找到做单记录']);
                // location.reload();
            }
        })
        // qq查询做单记录
        $btns.querySelector('.j-findQqBtn').addEventListener('click', () => {
            const qq = $byQQ.value;
            if (qq) {
                const arr = findDatasByQq(qq);
                // console.log(arr,qq)
                if (arr.length > 0) {
                    // 判断是否有一个qq多个手机的情况存在
                    // console.log(arr);
                    if (arr.length === 1) {
                        setCon(arr[0]);
                    } else {
                        setCon(arr);
                    }
                    // alert(JSON.stringify(arr));
                } else {
                    // alert('没找到记录');
                    setCon(['没找到做单记录'])
                    // location.reload();
                }
            }
        })
        // 查询不同的qq
        $btns.querySelector('.j-findQqs').addEventListener('click', () => {
            const qq = $byQQ.value;
            if (qq) {
                const arr = findDatasByQq(qq);
                // console.log(arr,qq)
                if (arr.length > 0) {
                    // 判断是否有一个qq多个手机的情况存在
                    // console.log(arr);
                    if (arr.length === 1) {
                        // setCon(arr[0]);
                        const datas = arr[0];
                        const qqs = findQqs(datas, qq);
                        if (qqs.length > 0) {
                            setCon(qqs);
                        } else {
                            setCon(['没有找到不同的qq'])
                        }
                    } else {
                        // setCon(arr);
                        let results = [];
                        arr.forEach(datas=>{
                            const qqs = findQqs(datas,qq);
                            if(qqs.length>0){
                                results.push(qqs);
                            }else{
                                results.push(['没有找到不同的qq'])
                            }
                        })
                        setCon(results);
                    }
                    // alert(JSON.stringify(arr));
                } else {
                    // alert('没找到记录');
                    setCon(['没找到做单记录'])
                    // location.reload();
                }
            }
        })
        // 筛选做单过的qq号
        qqAdd.querySelector('.j-gatherQqs').addEventListener('click',()=>{
            let endTime = new Date(new Date().getTime()-20*24*60*60*1000);
            let startTime = new Date(new Date().getTime()-30*24*60*60*1000);
            let DateRecords = [];
            const DatePhones = Object.keys(DATA);
            for (let phone of DatePhones) {
                const datas = DATA[phone];
                let data = datas[0];
                if(data.pig_over_time){
                    DateRecords.push(datas[0])
                }
            }
            DateRecords.sort((a,b)=>{
                if(new Date(a.pig_over_time)>new Date(b.pig_over_time)){
                    return -1;
                }else{
                    return 1;
                }
            })
            let records = [];
            DateRecords.forEach(record=>{
                if(records.length<30 && new Date(record.pig_over_time)<endTime){
                    records.push(DATA[record.pig_phone]);
                }
            })
            // console.log(records);
            let trs = '';
            records.forEach(datas=>{
                let humanData = humanDatas(datas);
                // console.log(humanData);
                trs+=`
                <tr>
                    <td>
                        <p>${humanData.phone}</p>
                    </td>
                    <td style="color: blueviolet;">
                        ${humanData.qqs.reduce((a,b)=>{
                            return a+`<p>${b}</p>`;
                        },'')}
                    </td>
                    <td style="color:red;">${humanData.record_num}</td>
                    <td style="color: rgb(16, 0, 255);">
                        ${humanData.notes.reduce((a,b)=>{
                            return a+`<p>${b}</p>`;
                        },'')}
                    </td>
                    <td style="color:red;">${humanData.record_time}</td>
                    <td>${humanData.record_qq}</td>
                </tr>
                `
            })
            let table = `
            <table class="common_table">
                <tbody>
                    <tr>
                        <th>手机号</th>
                        <th>全部qq号</th>
                        <th>已做单数量</th>
                        <th>备注</th>
                        <th>最近做单日期</th>
                        <th>最近做单qq号</th>
                    </tr>
                    ${trs}
                </tbody>
            </table>
            `
            setCon([table]);
        },false)
    }
    AddQQDiv();
    // 格式化phone的做单数据格式
    // function formatePhoneDatas
    // 通过qq查询到做单数据
    function findDatasByQq(qq) {
        const arr = [];
        const phones = Object.keys(DATA);
        for (let phone of phones) {
            const datas = DATA[phone];
            for (let data of datas) {
                if (trim(data.pig_qq) == trim(qq)) {
                    arr.push(datas);
                    break;
                }
            }
        }
        return arr;
    }
    // 通过qq查询到手机数组
    function findPhonesByQq(qq) {
        const arr = [];
        const datas = findDatasByQq(qq);
        datas.forEach(data=>{
            if(data.length>0 && !arr.includes(data[0].pig_phone))arr.push(trim(data[0].pig_phone));
        })
        return arr;
    }
    // 添加一个通过手机查询做单记录的功能，通过qq查找做单记录
    // const addFindDataByPhoneDiv = () => {
    //     const Div = document.createElement('div');
    //     Div.innerHTML = `
    //         <div class="">
    //             <style>
    //                 .m-findDate{
    //                     display:flex;
    //                     margin-top:15px;
    //                 }
    //                 .u-con p{
    //                     line-height: 1.5;
    //                 }
    //             </style>
    //             <div class="m-findData search">
    //                 <img class="search_icon" src="/static/home/images/userCenter/search.png" alt="查询">
    //                 <input class="search_input j-phone" placeholder="用户手机号" />
    //                 <button class="search_btn j-findPhoneBtn" style="width:auto;padding: 0 10px;">查询phone做单数据</button>
    //                 <input class="search_input j-qq" placeholder="用户qq" style="margin-left: 15px;" />
    //                 <button class="search_btn j-findQqBtn" style="background:rebeccapurple;width:auto;padding: 0 10px;">查询qq做单数据</button>
    //                 <button class="search_btn j-findQqs" style="width:auto;padding: 0 10px; margin-left: 10px;">查询不同的qq</button>
    //                 </div>
    //             <div class="u-con"></div>
    //         </div>
    //     `;
    //     document.querySelector('.release_tab').before(Div);
    //     const $con = Div.querySelector('.u-con');
    //     const setCon = arr => {
    //         let str = '';
    //         if (arr.length > 0) {
    //             arr.forEach(date => {
    //                 str += `<p>${JSON.stringify(date)}</p>`;
    //             })
    //         }
    //         $con.innerHTML = str;
    //     }
    //     // phone查询
    //     Div.querySelector('.j-findPhoneBtn').addEventListener('click', (e) => {
    //         const phone = Div.querySelector('.j-phone').value;
    //         if (phone && DATA[phone]) {
    //             console.log(DATA[phone]);
    //             // alert(JSON.stringify(DATA[phone]));
    //             setCon(DATA[phone]);
    //         } else {
    //             // alert('没找到记录');
    //             setCon(['没找到做单记录']);
    //             // location.reload();
    //         }
    //     })

    //     Div.querySelector('.j-findQqBtn').addEventListener('click', () => {
    //         const qq = Div.querySelector('.j-qq').value;
    //         if (qq) {
    //             const arr = findDatasByQq(qq);
    //             // console.log(arr,qq)
    //             if (arr.length > 0) {
    //                 // 判断是否有一个qq多个手机的情况存在
    //                 console.log(arr);
    //                 if (arr.length === 1) {
    //                     setCon(arr[0]);
    //                 } else {
    //                     setCon(arr);
    //                 }
    //                 // alert(JSON.stringify(arr));
    //             } else {
    //                 // alert('没找到记录');
    //                 setCon(['没找到做单记录'])
    //                 // location.reload();
    //             }
    //         }
    //     })
    //     // 查询不同的qq
    //     Div.querySelector('.j-findQqs').addEventListener('click', () => {
    //         const qq = Div.querySelector('.j-qq').value;
    //         if (qq) {
    //             const arr = findDatasByQq(qq);
    //             // console.log(arr,qq)
    //             if (arr.length > 0) {
    //                 // 判断是否有一个qq多个手机的情况存在
    //                 console.log(arr);
    //                 if (arr.length === 1) {
    //                     // setCon(arr[0]);
    //                     const datas = arr[0];
    //                     const qqs = findQqs(datas, qq);
    //                     if (qqs.length > 0) {
    //                         setCon(qqs);
    //                     } else {
    //                         setCon(['没有找到不同的qq'])
    //                     }
    //                 } else {
    //                     setCon(arr);
    //                 }
    //                 // alert(JSON.stringify(arr));
    //             } else {
    //                 // alert('没找到记录');
    //                 setCon(['没找到做单记录'])
    //                 // location.reload();
    //             }
    //         }
    //     })
    // }
    // addFindDataByPhoneDiv();
    //添加一个备注
    function addEventListener(el, eventName, eventHandler, selector) {
        if (selector) {
            const wrappedHandler = (e) => {
                if (e.target && e.target.matches(selector)) {
                    eventHandler(e);
                }
            };
            el.addEventListener(eventName, wrappedHandler);
            return wrappedHandler;
        } else {
            el.addEventListener(eventName, eventHandler);
            return eventHandler;
        }
    }
    const AddNote = () => {
        const Div = document.createElement('div');
        Div.innerHTML = `
            <style>
                .m-note{
                    display:flex;
                    margin-top: 15px;
                    margin-bottom: -45px;
                    flex-wrap: wrap;
                }
                .m-note>div{
                    display:inline-block;
                    margin-right: 15px;
                    line-height:2;
                    background: #e1e0e0;
                    padding:0 0 0 15px;
                    margin-bottom: 15px;
                    user-select: none;
                }
                .m-note>div:hover{
                    background: #efefef;
                }
                .m-note>div span{
                    display: inline-block;
                    padding: 0 15px;
                    background: red;
                    color: #fff;
                    margin-left: 15px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .m-note>div span:hover{
                    scale: 0.8;
                }
            </style>
            <div class="m-note">
                <!-- <div>备注1<span>×</span></div> -->
            </div>
        `;
        const Mnote = Div.querySelector('.m-note');
        document.querySelector('.release_tab').before(Div);
        const notes = localStorage.getItem('notes') ? JSON.parse(localStorage.getItem('notes')) : [];
        if (notes.length > 0) {
            let txt = '';
            notes.forEach(note => {
                txt += `<div>${note}<span>×</span></div>`;
            })
            Mnote.innerHTML = txt;
        }
        const updateNotes = () => {
            localStorage.setItem('notes', JSON.stringify(notes));
        }
        addEventListener(Mnote, 'click', (e) => {
            const $note = e.target.parentNode;
            const index = [...Mnote.children].indexOf($note);
            // console.log(index);
            if (confirm('确定删除吗？')) {
                notes.splice(index, 1);
                $note.remove();
                updateNotes();
            }
        }, 'div span')
        // localStorage.setItem('notes', JSON.stringify(['122', 'SSFD']))
    }
    AddNote();

    window.PIG = {
        Download,
        findNotes, findQqs
    }
})();
