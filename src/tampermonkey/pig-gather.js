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
    //         {pig_phone,pig_note} 添加备注
    //         {pig_phone,pig_qq} 添加不同的qq
    //         { pig_id, pig_phone, pig_qq, pig_register_time, pig_over_time } 正常小猪单
    //     ]
    // }
    // 获取已完成小猪数据
    const DATA = localStorage.getItem('completeOrders') ? JSON.parse(localStorage.getItem('completeOrders')) : {};
    const storageData = () => {
        localStorage.setItem('completeOrders', JSON.stringify(DATA));
    }
    // 获得每个tr数据
    const getTrData = ($tr) => {
        // console.log($tr);
        const pig_id = $tr.querySelector('td:nth-child(1)').textContent;
        const pig_phone = $tr.querySelector('td:nth-child(5)').textContent;
        const pig_qq = $tr.querySelector('td:nth-child(9)').textContent;
        const pig_register_time = $tr.querySelector('td:nth-child(10)').textContent;
        const pig_over_time = $tr.querySelector('td:nth-child(14)').textContent;
        return { pig_id, pig_phone, pig_qq, pig_over_time, pig_register_time };
    }
    const getData = () => {
        const $con = document.querySelector('.release_content .content_inner:nth-child(5)');
        const $trs = $con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');
        // console.log($trs);
        // console.log(getTrData($trs[0]))
        if (!$trs) true;
        const length = JSON.stringify(DATA).length == 2 ? $trs.length - 1 : 100;
        for (let i = length; i--; i >= 0) {
            const $tr = $trs[i];
            const trData = getTrData($tr);
            // DATA.push(getTrData($tr));
            if (!DATA[trData.pig_phone]) {
                DATA[trData.pig_phone] = [trData];
            } else {
                if (DATA[trData.pig_phone].find(data => data.pig_id == trData.pig_id)) continue;
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
        return Datas.filter(data => data.pig_id);
    }
    const formatTr = ($tr, phone_index = 5, qq_index = 8, date_index = 14, type) => {
        // console.log($tr);
        const $phone = $tr.querySelector(`td:nth-child(${phone_index})`);
        const phone = $phone.textContent;
        const $qq = $tr.querySelector(`td:nth-child(${qq_index})`);
        const qq = $qq.textContent;
        // console.log(phone, qq);
        // console.log(Datas);
        // 如果不存在就返回
        if (!DATA[phone]) {

            // 如果type==2，等待完成列表
            if (type == 2) {
                const Div = document.createElement('div');
                Div.className = 'search';
                Div.style = 'margin-top: 10px;'
                Div.innerHTML = `
            <button class="search_btn j-btn">添加记录</button>
            `;
                $phone.append(Div);
                const $btn =Div.querySelector('.j-btn');
                $btn.addEventListener('click',e=>{
                    DATA[phone]=[];
                    storageData();
                    alert('添加记录成功~')
                },false)
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
            qqDiv.innerHTML = `有不同的qq号：${Qqs.join('，')}`;
            $qq.append(qqDiv);
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
        $lately.innerHTML = `最近做单日期:${Datas[0].pig_over_time}`;
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
        qqAdd.className = "search";
        qqAdd.style = 'display:flex; align-items:center; height:auto; margin-top:15px;';
        qqAdd.innerHTML = `
            <style>
                .search .search_input{width:150px;}
            </style>
            <input class="search_input phone" placeholder="会员手机号" />
            <div style="margin-left:10px; margin-right:20px;">
                <div style="margin-bottom:10px;"><input class="search_input qq" placeholder="qq号" /><button class="search_btn add">添加不同qq</button><button class="search_btn del" style="background:red;margin-left:15px;">删除qq</button></div>
                <div><input class="search_input note" placeholder="用户备注" /><button class="search_btn add-note">添加备注</button><button class="search_btn del-note" style="background:red;margin-left:15px;">删除备注</button></div>
            </div>
            <input class="search_input gnote" placeholder="网页备注" /><button class="search_btn add-gnote">添加网页备注</button>
            <button class="search_btn download" style="background:rebeccapurple;margin-left:15px;">下载数据</button>
        `;
        document.querySelector('.release_tab').before(qqAdd);
        qqAdd.querySelector('.add').addEventListener('click', (e) => {
            const qq = qqAdd.querySelector('.qq').value;
            const phone = qqAdd.querySelector('.phone').value;
            // console.log(qq,phone);
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return;
                // DATA[phone] = [];
            }
            DATA[phone].push({
                pig_phone: phone,
                pig_qq: qq,
            })
            storageData();
            alert('qq添加成功');
            location.reload();
        }, false)
        qqAdd.querySelector('.del').addEventListener('click', e => {
            const qq = qqAdd.querySelector('.qq').value;
            const phone = qqAdd.querySelector('.phone').value;
            if (confirm('确定删除吗？')) {
                if (!DATA[phone]) {
                    alert('找不到对应的记录~')
                    return;
                    // DATA[phone] = [];
                }
                const datas = DATA[phone].filter(data => data.pig_id || data.pig_qq != qq);
                console.log(datas);
                DATA[phone] = datas;
                storageData();
                alert('qq删除成功');
                location.reload();
            }
        }, false)
        qqAdd.querySelector('.add-note').addEventListener('click', (e) => {
            const note = qqAdd.querySelector('.note').value;
            const phone = qqAdd.querySelector('.phone').value;
            // console.log(qq,phone);
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return;
                // DATA[phone] = [];
            }
            DATA[phone].push({
                pig_phone: phone,
                pig_note: note,
            })
            storageData();
            alert('备注添加成功');
            location.reload();
        }, false)
        qqAdd.querySelector('.del-note').addEventListener('click', e => {
            const note = qqAdd.querySelector('.note').value;
            const phone = qqAdd.querySelector('.phone').value;
            if (confirm('确定删除吗？')) {
                if (!DATA[phone]) {
                    alert('找不到对应的记录~')
                    return;
                    // DATA[phone] = [];
                }
                const datas = DATA[phone].filter(data => data.pig_note != note);
                console.log(datas);
                DATA[phone] = datas;
                storageData();
                alert('备注删除成功');
                location.reload();
            }
        }, false)
        qqAdd.querySelector('.add-gnote').addEventListener('click', (e) => {
            const gnote = qqAdd.querySelector('.gnote').value;
            if (!gnote) return;
            const notes = localStorage.getItem('notes') ? JSON.parse(localStorage.getItem('notes')) : [];
            notes.push(gnote);
            localStorage.setItem('notes', JSON.stringify(notes));
            alert('备注网页添加成功');
            location.reload();
        }, false)
        qqAdd.querySelector('.download').addEventListener('click', (e) => {
            Download();
        }, false)
    }
    AddQQDiv();
    // 添加一个通过手机查询做单记录的功能，通过qq查找做单记录
    const addFindDataByPhoneDiv = () => {
        const Div = document.createElement('div');
        Div.innerHTML = `
            <div class="">
                <style>
                    .m-findDate{
                        display:flex;
                        margin-top:15px;
                    }
                </style>
                <div class="m-findData search">
                    <img class="search_icon" src="/static/home/images/userCenter/search.png" alt="查询">
                    <input class="search_input j-phone" placeholder="用户手机号" />
                    <button class="search_btn j-findPhoneBtn" style="width:auto;padding: 0 10px;">查询phone做单数据</button>
                    <input class="search_input j-qq" placeholder="用户qq" style="margin-left: 15px;" />
                    <button class="search_btn j-findQqBtn" style="background:rebeccapurple;width:auto;padding: 0 10px;">查询qq做单数据</button>
                </div>
            </div>
        `;
        document.querySelector('.release_tab').before(Div);
        // phone查询
        Div.querySelector('.j-findPhoneBtn').addEventListener('click', (e) => {
            const phone = Div.querySelector('.j-phone').value;
            if (phone && DATA[phone]) {
                console.log(DATA[phone]);
                alert(JSON.stringify(DATA[phone]));
            } else {
                alert('没找到记录');
                // location.reload();
            }
        })
        // qq查询
        Div.querySelector('.j-findQqBtn').addEventListener('click', () => {
            const qq = Div.querySelector('.j-qq').value;
            const arr = [];
            if (qq) {
                const phones = Object.keys(DATA);
                for (let phone of phones) {
                    const datas = DATA[phone];
                    for (let data of datas) {
                        if (data.pig_qq == qq) {
                            arr.push(datas);
                            break;
                        }
                    }
                }
                // console.log(arr,qq)
                if (arr.length > 0) {
                    console.log(arr);
                    alert(JSON.stringify(arr));
                } else {
                    alert('没找到记录');
                    // location.reload();
                }
            }
        })
    }
    addFindDataByPhoneDiv();
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
