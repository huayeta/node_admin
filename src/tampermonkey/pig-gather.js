// ==UserScript==
// @name         小猪平台-汇总数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  汇总数据，并持久化保存，1周自动下载一次
// @author       You
// @match        http://190.92.199.222/home/member/fangdan.html
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    // {
    //     phone：[
    //         {pig_phone,ww_exec} 做单旺旺号
    //         {pig_phone,pig_qq?,qq_exec_pre,pig_over_time,shop_label?,pig_type?,is_comment?:0没评|1已评|-1默认评} 添加做单记录            
    //         {pig_phone,pig_note,create_time?,pig_type?} 添加备注
    //         {pig_phone,pig_qq} 添加不同的qq
    //         { pig_id, pig_phone, pig_qq, pig_register_time, pig_over_time, qq_exec_pre?, shop_label?,pig_type? ,is_comment?:0|1} 正常小猪单
    //     ]
    // }
    // 获取已完成小猪数据
    const DATA = localStorage.getItem('completeOrders') ? JSON.parse(localStorage.getItem('completeOrders')) : {};
    const QQS = {
        '31': {
            text: '小艾-1',
            color: 'blueviolet',
        },
        '30': {
            text: '小欣-2',
            color: 'red',
        },
        '21': {
            text: '小菜-5',
            color: 'black',
        },
        '20': {
            text: '小云-3',
            color: 'rebeccapurple',
        },
        '54': {
            text: '小韵-4',
            color: 'fuchsia'
        },
    }
    const storageData = () => {
        localStorage.setItem('completeOrders', JSON.stringify(DATA));
    }
    // 店铺数据
    const LABELS = {
        datas: [
            {
                label: '万阁',
                options: ['痔疮6', '肛裂5', '肛瘘7'],
            },
            {
                label: '广浴隆',
                options: ['肛瘘9', '肛裂5'],
            },
            {
                label: '艾跃',
                options: ['痔疮5', '疱疹2', '白斑2'],
            }
        ],
        jd_datas: [
            {
                label: '德医济世',
                options: ['肛瘘1'],
            }
        ],
        getShopOptionsHtml: (pig_type = 'TB') => {
            const datas = (pig_type == 'TB' ? LABELS.datas : LABELS.jd_datas);
            return `<option value="">没有选择店铺</option>` + datas.map(shop => {
                return `<optgroup label='${shop.label}'>${shop.options.map(option => `<option value='${shop.label}-${option}'>${shop.label}-${option}</option>`).reduce((a, b) => a + b, '')}</optgroup>`;
            }).reduce((a, b) => a + b, '');
        },
        getShopElement: (pig_type = 'TB') => {
            const $shop = document.createElement('select');
            $shop.innerHTML = LABELS.getShopOptionsHtml(pig_type);
            $shop.style = 'width:auto;';
            return $shop;
        }
    }
    // 店铺缓存数据
    const SHOPDATAS = {
        // {pig_id:shop_label}
        datas: {},
        getDatas: () => {
            let datas = localStorage.getItem('shopDatas') ? JSON.parse(localStorage.getItem('shopDatas')) : {};
            SHOPDATAS.datas = datas;
        },
        storageData: () => {
            localStorage.setItem('shopDatas', JSON.stringify(SHOPDATAS.datas));
        },
        addData: (pig_id, shop_label) => {
            if (Tools.alertFuc({ pig_id })) return false;
            SHOPDATAS.datas[pig_id] = shop_label;
            if (!shop_label) SHOPDATAS.delData(pig_id);
            SHOPDATAS.storageData();
            return true;
        },
        delData: (pig_id) => {
            delete SHOPDATAS.datas[pig_id];
            SHOPDATAS.storageData();
        },
        appendShopLable: (pig_phone, pig_id, shop_label) => {
            if (Tools.alertFuc({ pig_phone, pig_id })) return false;
            if (!DATA[pig_phone]) return alert('不存在做单数据');
            const datas = DATA[pig_phone];
            for (let i = 0; i < datas.length; i++) {
                if (datas[i].pig_id == pig_id) {
                    DATA[pig_phone][i].shop_label = shop_label;
                    if (!shop_label) delete DATA[pig_phone][i].shop_label;
                    SHOPDATAS.delData(pig_id);
                    storageData();
                }
            }
        },
        getData: (pig_id) => {
            return SHOPDATAS.datas[pig_id];
        }
    }
    SHOPDATAS.getDatas();
    //提醒phone数据
    const RDATA = {
        // {phone:time}[]
        datas: {},
        setDatas: (datas) => {
            RDATA.datas = datas;
            RDATA.storageData();
        },
        addData: (phone) => {
            RDATA.datas[phone] = new Date().toLocaleString();
            RDATA.storageData();
        },
        isExist: (phone) => {
            if (RDATA.datas[phone]) return true;
            return false;
        },
        getDatas: () => {
            let datas = localStorage.getItem('remindDatas') ? JSON.parse(localStorage.getItem('remindDatas')) : {};
            const results = {};
            const phones = Object.keys(datas);
            if (phones.length > 0) {
                phones.forEach(phone => {
                    const time = datas[phone];
                    if (new Date(time) > new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000)) {
                        results[phone] = time;
                    }
                })
            }
            // console.log(results);
            RDATA.setDatas(results);
        },
        storageData: () => {
            localStorage.setItem('remindDatas', JSON.stringify(RDATA.datas));
        },
    }
    RDATA.getDatas();
    // 一些工具函数
    const Tools = {
        alertFuc: obj => {
            const keys = Object.keys(obj);
            const values = Object.values(obj);
            let result = false;
            for (let i = 0; i < keys.length; i++) {
                if (!values[i]) {
                    alert(`${keys[i]}不能为空`);
                    result = true;
                    break;
                }
            }
            return result;
        },
        copyObj: (obj) => {
            return JSON.parse(JSON.stringify(obj));
        },
        // 添加旺旺号
        addWW: (pig_phone, ww_exec) => {
            if (Tools.alertFuc({ pig_phone, ww_exec })) return false;
            if (!DATA[pig_phone]) return alert('不存在小猪数据');
            // 判断是否已经有旺旺
            const datas = DATA[pig_phone];
            let tx = false;
            for (let data of datas) {
                if (data.ww_exec && data.ww_exec == ww_exec) tx = true;
            }
            if (tx == true) return alert('已经添加过旺旺号了');
            DATA[pig_phone].push({ pig_phone: pig_phone, ww_exec: ww_exec });
            storageData();
            return true;
        },
        findPhoneByWW: (ww_exec) => {
            const arr = [];
            Object.keys(DATA).forEach(phone => {
                const datas = DATA[phone];
                for (let i = 0; i < datas.length; i++) {
                    const data = datas[i];
                    if (data.ww_exec == ww_exec) {
                        arr.push(data.pig_phone);
                        break;
                    }
                }
            })
            return arr;
        },
        getPigType: (str) => {
            let pig_type = str;
            if (pig_type.search('TB') !== -1) {
                pig_type = 'TB';
            } else if (pig_type.search('JD') !== -1) {
                pig_type = 'JD';
            }
            return pig_type;
        },
        // 通过手机给最后一个记录添加评论或者默认评论或者直接评论
        lastAddCommentByPhone: (phone,is_comment='1') => {
            if (Tools.alertFuc({ phone,is_comment })) return false;
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return false;
                // DATA[phone] = [];
            }
            DATA[phone][0].is_comment = is_comment;
            storageData();
            return true;
        },
        // 添加做单记录按钮
        addRecord: (phone, parentNode, text) => {
            const button = document.createElement('button');
            button.className = 'search_btn';
            button.innerHTML = text || "添加记录";
            button.addEventListener('click', () => {
                if (typeof phone == 'function') phone = phone();
                if (Tools.alertFuc({ phone })) return;
                if (DATA[phone]) return alert('已经存在记录~');
                DATA[phone] = [];
                storageData();
                alert('添加记录成功~')
            }, false)
            if (parentNode) {
                parentNode.append(button);
            }
            return button;
        },
        // 判断是否是做单记录
        isRecord:(data)=>{
            if(data.pig_over_time)return true;
            return false;
        },
        // 缩短记录
        getShortDatas :(datas,len)=>{
            const arr = [];
            let index = 0;
            datas.forEach(data=>{
                if(arr.length>=len){
                    if(!Tools.isRecord(data)){
                        arr.push(data);
                    }else{
                        index++;
                    }
                }else{
                    arr.push(data);
                }
            })
            if(index>0){
                arr.splice(len,0, `<span style="color:gray;">.......此处省略${index}个记录........</span>`);
            }
            return arr;
        }
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
        const pig_type = Tools.getPigType($tr.querySelector('td:nth-child(3)').textContent);


        let result = { pig_id, pig_phone, pig_qq, pig_over_time, pig_register_time, pig_type };
        let arr = /^.&?.?，(\d+?)\：/.exec(pig_title);
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
            const shop_label = SHOPDATAS.getData(trData.pig_id);
            if (shop_label) {
                trData.shop_label = shop_label;
            }
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
        const notes = localStorage.getItem('notes');
        const remindDatas = localStorage.getItem('remindDatas');
        const data = {
            completeOrders: DATA,
            notes: notes ? JSON.parse(notes) : {},
            downloadTime: localStorage.getItem('downloadTime'),
            remindDatas: remindDatas ? JSON.parse(remindDatas) : {}
        }
        MDownload([JSON.stringify(data)], '小猪数据');
        localStorage.setItem('downloadTime', new Date().toLocaleString());
    }
    if (localStorage.getItem('downloadTime')) {
        if ((new Date().getTime() - 2 * 24 * 60 * 60 * 1000) > new Date(localStorage.getItem('downloadTime')).getTime()) {
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
    const findNotes = (datas, pig_type = 'TB') => {
        const arr = [];
        datas.forEach(data => {
            const obj = Tools.copyObj(data);
            if (!obj.pig_type) obj.pig_type = 'TB';
            if (obj.pig_type == pig_type && obj.pig_note) arr.push(obj);
        })
        return arr;
    }
    // 找到phone的旺旺账号
    const findWWExecs = (datas) => {
        const arr = [];
        datas.forEach(data => {
            if (data.ww_exec) arr.push(data.ww_exec);
        })
        return arr;
    }
    // 汇总phone数据里面的店铺数据
    const findShopLabels = (datas,switch_time,record_color) => {
        const results = [];
        datas.forEach((data,index)=>{
            // 添加已换号
            if(switch_time){
                // 3天误差
                if(new Date(new Date(switch_time).getTime() - 3 * 24 * 60 * 60 * 1000)>new Date(data.pig_over_time)){
                    results.unshift('<span style="color:red;">已换号</span>');
                    switch_time = undefined;
                }
            }
            if(data.shop_label){
                const shopLabels = data.shop_label.split('-');
                // 合并店铺
                if(datas[index+1] && datas[index+1].shop_label && datas[index+1].shop_label.indexOf(shopLabels[0])!==-1){
                    results.unshift((record_color && index===0)?`<span style="color:${record_color}">${shopLabels[1]}</span>`:shopLabels[1]);
                }else{
                    results.unshift((record_color && index===0)?`<span style="color:${record_color}">${data.shop_label}</span>`:data.shop_label);
                }
            }
        })
        return results;
    }
    // 格式化等待完成的数据
    // 找到phone对应的pig_type得做单数据
    const getDatasByPigType = (Datas = [], pig_type = 'TB') => {
        const datas = Tools.copyObj(Datas);
        return datas.filter((data,index) => {
            if (!data.pig_type) data.pig_type = 'TB';
            if(data.pig_over_time && data.pig_type == pig_type){
                // 筛选出来连续做单错误记录
                if(datas[index-1] && new Date(new Date(data.pig_over_time).getTime() + 2 * 24 * 60 * 60 * 1000) > new Date(datas[index-1].pig_over_time)){
                    return false;
                }
                return true;
            }
            return false;
        });
    }
    // 人性化的做单记录数据
    const humanDatas = (datas, qq = "1", pig_type = 'TB') => {
        // 备注数据
        let notes = findNotes(datas, pig_type);
        // pig_type做单数据
        let records = getDatasByPigType(datas, pig_type);
        // 找到所有的qq号
        let qqs = findQqs(datas, qq);
        // 找到不同的手机号
        let diffPhones = findDiffPhonesByDatas(datas);
        // 找到注册时间
        let register_time = '';
        for (let i = 0; i < records.length; i++) {
            if (records[i].pig_register_time) {
                register_time = records[i].pig_register_time;
                break;
            }
        }
        function formateDatasByPigType(datas, pig_type) {
            const records = getDatasByPigType(datas, pig_type);
            // 备注数据
            let notes = findNotes(datas, pig_type);
            // 记录颜色
            const record_color = records.length > 0 && records[0].qq_exec_pre && QQS[records[0].qq_exec_pre].color || '';
            // 切换时间
            let switch_time;
            notes.forEach(note=>{
                if(note.pig_note && note.pig_note.indexOf('已换号')!==-1){
                    switch_time =note.create_time;
                }
            })
            // 汇总店铺做单记录
            let shopLabels = findShopLabels(records,switch_time,record_color);
            // console.log(records);
            return {
                datas: records,
                record_time: records.length > 0 && records[0].pig_over_time || '',
                record_qq: records.length > 0 && records[0].qq_exec_pre && QQS[records[0].qq_exec_pre].text || '',
                record_color: record_color,
                record_num: records.length,
                record_shop_label_last: records.length > 0 && (records[0].shop_label || ''),
                record_shop_labels : shopLabels.join('-'),
                record_comment: records.length > 0 && records[0].is_comment,
                notes: notes.map(note=>note.pig_note),
            }
        }
        // 找到旺旺账号
        let wwExecs = findWWExecs(datas);
        return {
            phone: datas.length > 0 && datas[0].pig_phone,
            qqs: qqs,
            notes: notes.map(note=>note.pig_note),
            records: records,
            typeDatas: {
                'TB': formateDatasByPigType(datas, 'TB'),
                'JD': formateDatasByPigType(datas, 'JD'),
            },
            register_time: register_time,
            record_time: records.length > 0 && records[0].pig_over_time,
            record_qq: records.length > 0 && records[0].qq_exec_pre && (QQS[records[0].qq_exec_pre].text || ''),
            record_color: records.length > 0 && records[0].qq_exec_pre && (QQS[records[0].qq_exec_pre].color || ''),
            record_num: records.length,
            diffPhones: diffPhones,
            wwExecs: wwExecs,
        }
    }
    // 找到不同的手机号
    const findDiffPhonesByDatas = (datas) => {
        if (datas.length == 0) return [];
        const phone = datas[0].pig_phone;
        // 找到所有的qq号
        let qqs = findQqs(datas, '1');
        if (qqs.length == 0) return [];
        // let phones_arr = findPhonesByQq(qqs[0]);
        let phones_arr = [];
        qqs.forEach(qq => {
            // console.log(findPhonesByQq(qq))
            phones_arr = phones_arr.concat(findPhonesByQq(qq))
        });
        // 去重
        phones_arr = [...new Set(phones_arr)];
        // 去除自身phone
        phones_arr = phones_arr.filter(phone_tmp => phone_tmp != phone);
        return phones_arr;
    }
    function trim(str) {
        if (!str) return str;
        str = str.replace(/\ +/g, '');
        str = str.replace(/[\r\n\t]/g, '');
        str = str.trim();
        return str;
    }
    const formatTr = ($tr, phone_index = 5, qq_index = 8, date_index = 14, type) => {
        // console.log($tr);
        const $phone = $tr.querySelector(`td:nth-child(${phone_index})`);
        const phone = trim($phone.textContent);
        const $qq = $tr.querySelector(`td:nth-child(${qq_index})`);
        const qq = trim($qq.textContent);
        const pig_id = trim($tr.querySelector(`td:nth-child(${type == 3 ? 2 : 1})`).textContent);
        const pig_type = Tools.getPigType(trim($tr.querySelector(`td:nth-child(${type == 3 ? 4 : 3})`).textContent));
        // console.log(pig_type)
        // console.log(phone, qq);
        // console.log(Datas);
        // 标注店铺
        {
            // const $shop = document.createElement('select');
            // $shop.innerHTML = `<option value="">没有选择</option>`+LABELS.map(shop=>{
            //     return `<optgroup label='${shop.label}'>${shop.options.map(option=>`<option value='${shop.label}-${option}'>${shop.label}-${option}</option>`).reduce((a,b)=>a+b,'')}</optgroup>`;
            // }).reduce((a,b)=>a+b,'');
            // $shop.style = 'width:auto;';
            const $shop = LABELS.getShopElement(pig_type);
            $shop.addEventListener('change', e => {
                const value = e.target.value;
                // console.log(value);
                if (type != 5) {
                    SHOPDATAS.addData(pig_id, value);
                } else {
                    // 如果是已完成列表
                    SHOPDATAS.appendShopLable(phone, pig_id, value);
                }
            }, false)
            if (type != 5) {
                if (SHOPDATAS.getData(pig_id)) {
                    $shop.value = SHOPDATAS.getData(pig_id);
                }
            } else {
                // 已完成列表
                DATA[phone] && DATA[phone].length > 0 && DATA[phone].forEach(data => {
                    if (data.pig_id == pig_id && data.shop_label) {
                        $shop.value = data.shop_label;
                    }
                })
            }
            const $lastTd = $tr.querySelector('td:last-child');
            $lastTd.prepend($shop);
        }
        // 如果不存在就返回
        if (!DATA[phone]) {

            // 如果type==2，等待完成列表
            if (type == 2 || true) {
                const Div = document.createElement('div');
                Div.className = 'search';
                Div.style = 'margin-top: 10px;';
                Tools.addRecord(phone, Div);
                $phone.append(Div);
            }

            return;
        }
        const humans = humanDatas(DATA[phone], qq, pig_type);
        const Datas = humans.records;
        // console.log(DATA[phone], qq);
        const Qqs = humans.qqs;
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
        if (qq == '1451603208' && type == 2 || true) {
            const phones_arr = humans.diffPhones;
            if (phones_arr.length > 0) {
                // console.log(`插入${JSON.stringify(phones_arr)}`)
                const Div = document.createElement('div');
                Div.style = 'color:blueviolet;';
                let str = phones_arr.reduce((a, b) => {
                    let Datas = getDatasByPigType(DATA[b], pig_type);
                    if (Datas.length == 0) {
                        return a + `<p>${b}，<br/>已做单：${Datas.length}`;
                    }
                    return a + `<p>${b}，<br/>已做单：${Datas.length}，<br/>最近做单日期：${Datas[0].pig_over_time}，<br/>最近做单qq：${QQS[Datas[0].qq_exec_pre] ? QQS[Datas[0].qq_exec_pre].text : Datas[0].qq_exec_pre}</p>`
                }, '')
                Div.innerHTML = `有不同的手机号：${str}`;
                $phone.append(Div);
            }
        }

        // 标注备注信息
        const Notes = humans.notes;
        if (Notes.length > 0) {
            const Div = document.createElement('div');
            Div.style = 'color:#1000ff;max-width: 100px;margin:0 auto;';
            Div.innerHTML = `备注：${Notes.join('，')}`;
            $qq.append(Div);
        }
        // 标注旺旺号
        if (humans.wwExecs.length > 0 && pig_type == 'TB') {
            const $wwTr = $tr.querySelector('td:nth-child(7)');
            const $wwDiv = document.createElement('div');
            $wwDiv.style = 'color: rgb(16, 0, 255);';
            $wwDiv.innerHTML = `旺旺号：${humans.wwExecs.join('，')}`;
            $wwTr.append($wwDiv);
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
        if (Datas[0].qq_exec_pre) latelyStr += `<P>最近做单qq：${QQS[Datas[0].qq_exec_pre].text}</P>`;
        if (Datas[0].shop_label) latelyStr += `<p>最后做单产品:${Datas[0].shop_label}</p>`;
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
            formatTr($tr, 6, 9, 14, 3);
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
            if (true || index < 100) formatTr($tr, 5, 9, 14, 5);
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
            if (index < 20) formatTr($tr, 5, 7, 12);
        })
    }
    startFormatCancelCon();
    // 得到做单的trs
    function getDataTable(records, btn = [{ text: '标注已评价', className: 'j-addComment',texted:"已评价",val:'1' },{ text: '标注默认评价', className: 'j-addComment',texted:'已默认评价',val:'-1' }]) {
        let trs = '';
        records.forEach(datas => {
            let humanData = humanDatas(datas);
            // console.log(humanData);
            let btnStr = '';
            if (typeof btn == 'string' && btn) {
                btnStr = btn;
            }
            if (Object.prototype.toString.call(btn) == '[object Object]') {
                btnStr = `<a style="color:red;margin-left:10px;cursor:pointer;" class="${btn.className}" data-qq="${humanData.qqs[0]}" data-phone="${humanData.phone}" data-datas="${JSON.stringify(btn).replaceAll('"',"'")}">${btn.text}</a>`;
            }
            if(Object.prototype.toString.call(btn) == '[object Array]'){
                btnStr+='<div style="margin-top:10px;margin-right:-10px;">';
                btn.forEach(bt=>{
                    btnStr+= `<a style="color:red;margin-right:10px;cursor:pointer;" class="${bt.className}" data-qq="${humanData.qqs[0]}" data-phone="${humanData.phone}" data-datas="${JSON.stringify(bt).replaceAll('"',"'")}">${bt.text}</a>`;
                })
                btnStr+='</div>';
            }
            trs += `
            <tr>
                <td>
                    <p><span class="j-phone j-copyText">${humanData.phone}</span>${btnStr}</p>
                    ${humanData.diffPhones.length > 0 ? ('<p style="color:red;">有不同的手机号：' + JSON.stringify(humanData.diffPhones) + '</p>') : ''}
                </td>
                <td style="color: blueviolet;">
                    ${humanData.qqs.reduce((a, b) => {
                return a + `<p class="j-copyText">${b}</p>`;
            }, '')}
                </td>
                <td style="color:red;">
                    ${humanData.wwExecs.reduce((a, b) => {
                return a + `<p class="j-copyText">${b}</p>`;
            }, '')}
                </td>
                <td>
                    <table style="width:100%;">
                        <tbody>
                            <tr>
                                <th></th>
                                <th>TB</th>
                                <th>JD</th>
                            </tr>
                            <tr>
                                <td>最近做单qq号</td>
                                <td style="color:${humanData.typeDatas.TB.record_color}">${humanData.typeDatas.TB.record_qq}</td>
                                <td style="color:${humanData.typeDatas.JD.record_color}">${humanData.typeDatas.JD.record_qq}</td>
                            </tr>
                            <tr>
                                <td>最近做单日期</td>
                                <td style="color:red;">${humanData.typeDatas.TB.record_time}</td>
                                <td style="color:red;">${humanData.typeDatas.JD.record_time}</td>
                            </tr>
                            <tr>
                                <td>已做单数量</td>
                                <td style="color: rgb(16, 0, 255);">${humanData.typeDatas.TB.record_num}</td>
                                <td style="color: rgb(16, 0, 255);">${humanData.typeDatas.JD.record_num}</td>
                            </tr>
                            <!-- <tr>
                                <td>最后做单产品</td>
                                <td style="color:${humanData.typeDatas.TB.record_color}">${humanData.typeDatas.TB.record_shop_label_last || ''}</td>
                                <td style="color:${humanData.typeDatas.JD.record_color}">${humanData.typeDatas.JD.record_shop_label_last || ''}</td>
                            </tr> -->
                            <tr>
                                <td>做单店铺顺序</td>
                                <td>${humanData.typeDatas.TB.record_shop_labels || ''}</td>
                                <td>${humanData.typeDatas.JD.record_shop_labels || ''}</td>
                            </tr>
                            <tr>
                                <td>评论状态</td>
                                <td>${humanData.typeDatas.TB.record_comment=='1'?'<span style="color:gray;">已经评价</span>':humanData.typeDatas.TB.record_comment=='-1'?'<span style="color:rgb(16, 0, 255);">默认评价</span>':humanData.typeDatas.TB.record_comment || ''}</td>
                                <td>${humanData.typeDatas.JD.record_comment=='1'?'<span style="color:gray;">已经评价</span>':humanData.typeDatas.JD.record_comment=='-1'?'<span style="color:rgb(16, 0, 255);">默认评价</span>':humanData.typeDatas.JD.record_comment || ''}</td>
                            </tr>
                            <tr>
                                <td>备注</td>
                                <td style="color:red;">
                                    ${humanData.typeDatas.TB.notes.reduce((a, b) => {
                return a + `<p>${b}</p>`;
            }, '')}
                                </td>
                                <td style="color:red;">
                                    ${humanData.typeDatas.JD.notes.reduce((a, b) => {
                return a + `<p>${b}</p>`;
            }, '')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td>${humanData.register_time}</td>
            </tr>
            `
        })
        let table = `
        <table class="common_table" style="margin-top:10px; margin-bottom:10px;">
            <tbody>
                <tr>
                    <th>手机号</th>
                    <th>全部qq号</th>
                    <th>旺旺号</th>
                    <th>做单数据</th>
                    <th>注册时间</th>
                </tr>
                ${trs}
            </tbody>
        </table>
        `
        return table;
    }
    // 添加不同qq，用户备注，网页备注
    const AddQQDiv = () => {
        const qqAdd = document.createElement('div');
        let option_strs = '';
        const qqs_obj = {};
        Object.keys(QQS).forEach(num => {
            option_strs += `<option value=${num} ${num == '54' ? `selected` : ''}>${num}：${QQS[num].text}</option>`;
            qqs_obj[num] = QQS[num].text;
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
                <div class="search m-search j-order-search">
                    查询订单是否被抓：<input class="search_input order-id" placeholder="查询订单号" /> <button class="search_btn order-search
                    " style="margin: 0 10px;">查询</button><div class="orderCon" style="color:gray;"></div>
                    <input class="search_input ww-id" placeholder="旺旺号" /> <button class="search_btn ww-add
                    " style="margin: 0 10px;">添加旺旺号</button><button class="search_btn ww-del" style="background:red;">删除旺旺号</button>
                </div>
                <div class="btns">
                    <style>
                        .m-findData{
                            display:flex;
                            margin-top:15px;
                            align-items:center;
                        }
                        .m-findData .search_btn{
                            width:auto;
                            padding: 0 10px;
                            margin-right: 10px;
                            white-space: nowrap;
                        }
                        .m-findData .search_input{
                            width: auto;
                            margin-right: 10px;
                            padding-left: 10px;
                        }
                        .u-con p{
                            line-height: 1.5;
                        }
                    </style>
                    <!-- <div style="color:darkmagenta; ">${JSON.stringify(qqs_obj)}</div> -->
                    <div class="m-findData search">
                        <button class="search_btn j-findPhoneBtn" style="">查询phone做单数据</button>
                        <button class="search_btn j-findQqBtn" style="background:rebeccapurple;">查询qq做单数据</button>
                        <button class="search_btn j-findQqs" style="">查询不同的qq</button>
                        <button class="search_btn download" style="background:rebeccapurple;">下载数据</button>
                        <button class="search_btn j-gatherQqs" style="">筛选qq</button>
                        <button class="search_btn j-gatherRegisterQqs" style="background:rebeccapurple;">注册时间筛选qq</button>
                        <button class="search_btn j-gatherShop" style="">查询店铺做单数据</button>
                        <div class="j-addOtherRecord"></div>
                    </div>
                    <div class="m-findData search" style="margin-top:0px;">
                        <select class="search_input j-comment-sel"><option value="" selected>未知评价</option><option value="1">已评价</option><option value="-1">默认评价</option></select>
                        <select class="search_input j-screen"><option value="1">筛选被抓</option><option value="0" selected>不筛选被抓</option></select>
                        <select class="search_input j-pig-type"><option value="TB">TB</option><option value="JD">JD</option></select>
                        <select class="search_input j-shop-id">${LABELS.getShopOptionsHtml()}</select>
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
        const $pigType = qqAdd.querySelector('.j-pig-type');
        // 不同qq查找到手机号
        qqAdd.querySelector('.byqq').addEventListener('input', e => {
            const qq = $byQQ.value;
            const datas = findDatasByQq(qq);
            // console.log(datas);
            if (datas.length > 0) {
                if (datas.length === 1) {
                    const phone = datas[0][0].pig_phone;
                    $phone.value = phone;
                    const wwExecs = findWWExecs(DATA[phone]);
                    qqAdd.querySelector('.j-order-search .ww-id').value = wwExecs.join('，');
                } else {
                    $phone.value = '有多个手机号';
                }
            } else {
                $phone.value = '';
            }

        })
        // 旺旺号变化之后的反应
        qqAdd.querySelector('.j-order-search .ww-id').addEventListener('input', e => {
            const wwExec = e.target.value;
            if (wwExec) {
                const phoneArr = Tools.findPhoneByWW(wwExec);
                // console.log(phoneArr);
                if (phoneArr.length > 0) {
                    $phone.value = phoneArr.join(',');
                }
            }
        }, false)
        // 查询订单是否违规
        qqAdd.querySelector('.j-order-search .order-search').addEventListener('click', e => {
            const orderId = qqAdd.querySelector('.j-order-search .order-id').value;
            const orderCon = qqAdd.querySelector('.j-order-search .orderCon');
            if (!orderId) return alert('orderId不能为空');
            const orderConArr = [];
            const ordersA = `1815460827279566990
            1817271266178243978
            1817602140122228778
            1818450084014675383
            1818994044235558870
            1819666059839260884
            1820644357963458575
            1821554187209890384
            1821618951688497696
            1821810109273800189
            1822312310661445377
            1823295759851146875
            1823621881203264981
            1824302570776340779
            1824969901410090571
            1831027296791183189
            1831718247294838292
            1831736103281374186
            1831783945148713274
            1832321931280585070
            1835027977116394569
            1835096810379981390
            1835896441989075470
            1836854328088966987
            1836970932968243991
            1837831224766583186
            1837952331899825187
            1839129423001243978
            3190959723616364654
            3191587059587307714
            3192445730788521941
            3192504733519047144
            3192803786331532508
            3195283609116755832
            3195432109106209462
            3198573576234885237
            3199014686311448558
            3201166045056787309
            3201576913120363460
            3201880284350859443
            3202044267374821153
            3202624008802117151
            3202841306961540348
            3202890627003246163
            3203070879560232923
            3207732087442232348
            3209679506353748507
            3210699350591053005
            3211138729432520952
            3211661016453896810
            3212619266528146630
            3212904279346053428
            3217762692087755832
            3218768318492747345
            3220567814304371042
            3223369263087317159
            3226285584630180333
            3228127194350624425
            3230169913790882809
            3230666712936008344
            3230962021394255823
            3231643932945951609
            3232967185098257100
            3234538839108838232
            3236926212108539009
            3238153994286784749
            3239680824760638209
            3240270687419466310
            3240440822117633848
            3241540045784541124
            3241856880304298565
            3241966179425558217
            3241985007211782311
            3243672109846001439
            3244695950175609617
            3244760426194303255
            3245687533552476225
            3246714147055822559
            3248038440214419642
            3248499278529970547
            3250881255956635934
            3251040555375086858`.split(`
            `);
            if (ordersA.includes(orderId.trim())) {
                orderConArr.push('<span style="color:red;">查询到艾跃被抓;</span>')
            } else {
                orderConArr.push('没查询到;');
            }
            const ordersW = `1820969364988713274
            1821522288253075470
            1821664885830583186
            1825383253095229687
            1827108048928228778
            1828015320966558870
            1828953698221598572
            1829747894434408577
            1831446444649429896
            1833388212265683887
            1834151811449445377
            1834190367234090571
            1834298546980566990
            1835922435366196197
            1836780456455486371
            1836879168963229267
            1838654401584674568
            1841925109192225367
            1842482210256806372
            1842594315047374186
            1843818603895277785
            1843834117495520195
            1846212062570380991
            1849170865145661985
            1849193582860626270
            3205254961185529209
            3207179629620853108
            3208678848606459045
            3208754126055303255
            3215433891558061319
            3219592431579208326
            3220363982060541124
            3220586787567337613
            3220721029057322832
            3222405180822782311
            3223701612713232923
            3226705165602419642
            3226788073227430762
            3226953458082826645
            3228010490199232348
            3229532967342427526
            3230166133581602557
            3230680791748430035
            3230749297245862545
            3230763229785399320
            3230896466229495310
            3231170931338520952
            3232195020241646057
            3232338121899089502
            3232406162208552316
            3232870563825208443
            3233414667582665659
            3234125520125343810
            3235060010745020851
            3235380735769600411
            3235417995377924815
            3236827096919270844
            3237031764895997924
            3238449948061905542
            3238788313258117151
            3239168293869863828
            3239285006461497126
            3239543127603462140
            3239643459945451601
            3240773280696319443
            3241760508559903024
            3242411641193462549
            3243174555904764032
            3243609757457448558
            3245445864031024252
            3245624425506865719
            3246129758471172132
            3246174468078077214
            3248013420647748507
            3249751609578364654
            3250567838467878152
            3252037500197232348
            3252230246086259864
            3252284715189729032
            3252644317780399320
            3252713833439054109
            3253820148474747852
            3254178708186371042
            3254648942517951609
            3255643765578092310
            3255650857584646057
            3255966399748877724
            3257958566591255823
            3260082026913828665
            3264451527061876404
            1828237728060778176
            1828736834778243978
            1833236401586609985
            1833342602252294368
            1834233027975995469
            1836753279798514280
            1836753997633490696
            1837829390758984289
            1838126931582340779
            1840464085002610277
            1840566255514324170
            1840872074533142477
            1841252091412948883
            1842154070383473192
            1842548090772884168
            1842864889581713274
            1843838185039626878
            1844559987680609985
            1845469236162759395
            1845771492756967692
            1846137469866487367
            1846210227071191578
            1846211918128442881
            1846254506022409775
            1846500315231394569
            1846527315839534496
            1849143650427344671
            1852525453132243991
            1854363469009497696
            3221109290786903024
            3223364799383531312
            3224304361792476225
            3226163436143465244
            3226950902450821153
            3227277819013255937
            3227348163867224738
            3229065793626729032
            3229344756022092310
            3230677081487259864
            3231573699157142612
            3234170414313787309
            3238203027152307631
            3238648092919409256
            3240126037898119803
            3241600202061299957
            3241791144261655931
            3241882443723589759
            3245017359628679303
            3247268293182053005
            3247364196541637058
            3247460028296465244
            3248186581773486341
            3248389047786892756
            3248731298800521941
            3248947011807459620
            3249829548713909734
            3250947027577413547
            3252192516107015203
            3254031972595257100
            3254041476501243641
            3254611141224312258
            3254909043999122156
            3255226887718674512
            3255289563168865631
            3255781934283478664
            3256026303909053428
            3256970797298141218
            3257669196636695143
            3257871768213969748
            3258460981866936436
            3258829442492821153
            3260161731007067152
            3260213247619246535
            3260286831434860835
            3264088285353589759
            3266544493987924815
            3268641422544344247
            3268762923219643640
            3270366829182119803
            3270722115810955463
            3270787380194422904
            3271528405104502063
            3273211188693663629
            3273468518694061319
            3274425360463860644
            3275786630541180333
            3275867160525815252
            3276410473005578526
            3276788618269048001
            3276833655508970547
            3276979563953783439
            3278454375894878527
            1838655769859227798
            1842793969472774868
            1842815208214100993
            1843890459457088794
            1846571306365673299
            1847105617022869885
            1849140409913467989
            1849233794477290469
            1851280932663232684
            1852003671185149192
            1853829301885129679
            1855320422308905997
            1855622283978774773
            1855710876138324170
            1857172515168093683
            1857723963318865897
            1857776703844942484
            1858188183649838292
            1858213814811825187
            1858584145352673299
            1858701865101442088
            1860882387829960984
            1861583127716247585
            3239050464113762101
            3249087123203110709
            3250985042413173265
            3252114432300352112
            3252630169261296212
            3252913993899289145
            3254934458454392033
            3256049126629532508
            3262588166236481249
            3267777096570744545
            3271763918734885237
            3272242755439223548
            3274302708745828606
            3275774139403167404
            3276585721754100425
            3276615925232657824
            3277475715268914861
            3277520424478173265
            3279698499622476426
            3280511163369079433
            3280976964579540821
            3281826746487536250
            3282338415486859443
            3283011829994790145
            3283243885729102000
            3283306418516153633
            3284279354714146630
            3284761321493727162
            3286111105118307714
            3286537671437523320
            3286907497902330011
            3287605251535298565
            3290361733324747345`.split(`
            `);
            if (ordersW.includes(orderId.trim())) {
                orderConArr.push('<span style="color:red;">查询到万阁被抓;</span>')
            } else {
                orderConArr.push('没查询到;');
            }
            const ordersG = `1851986533286061969
            1853756221506229687
            1853779621727890384
            1853842406348995469
            1854736790307778176
            1855735644960806372
            1856999244844277785
            1857849313273566990
            1858474992499984289
            1858730271329142477
            1859528030383609985
            1859960822695429896
            1860577825661264981
            1860877275554520195
            1861101591237090571
            1861754270781344671
            1861765323964583186
            1861770001305228778
            1862224539974626878
            1862391216728639880
            1863634298797746868
            1864129980447473192
            1864309659525869885
            1864822298982420677
            1864847714349445377
            1865378138498227798
            1865414750655661985
            1865425513708243991
            1865844123064497696
            1865885378202637571
            1865994783912713274
            1866423396996487598
            1867187319814709989
            1867430966197374186
            3265815132186029507
            3268744455206063618
            3270802359051078860
            3270866256104343810
            3272210571139029719
            3273424742489319443
            3274239027111208326
            3274394004706931610
            3275213654679308264
            3275662359897604063
            3276913177810430762
            3277325127756255937
            3278401203594878152
            3278892459800352112
            3278904303197729032
            3279318013201289145
            3279387888514054109
            3279472418636296212
            3279514862649259864
            3279521198646520952
            3280584565051552316
            3280869685877997306
            3280971603768208443
            3281882258451092310
            3281929706867255823
            3282052033500821153
            3283232474762448558
            3284537149965122156
            3284931313211941951
            3284959537722317336
            3285809893413364654
            3286014228507748507
            3286067007084015203
            3286634940326419642
            3286782578123865631
            3287404982779903024
            3287496097008142612
            3287780427371787309
            3288769670661413547
            3289119301391497126
            3289312512527924815
            3289349631304299957
            3290476790089125803
            3292540740851322832
            3292803720488665659
            3293581503741617148
            3294309063205744545
            3294429806725307631
            3294725438889246535
            3295277749776755832
            3296083538026399320
            3297242809743970547
            3297604863245533543
            3297608028194291903
            3298040283282521941
            3298881099833476225
            3299406768340296212
            3299612870923655931
            3299744091771173265
            3299761263578465244
            3300108229713774773
            3300225123808232923
            3300253200810878527
            3300254172762054109
            3301147191052079433
            3301274341361224738
            3301565367760481249
            3301950783677289145
            3302608645886942704
            3302870151301970818
            1854530580185674568
            1855413372195637571
            1857202935923100993
            1858198767752380991
            1859286108535967692
            1867947206561340779
            1868660006404884168
            1868991458211558870
            1869877022032442881
            1870702287835905997
            1870857805818673299
            1871503860421881876
            1871933415402865897
            3275863128545679303
            3276482905702224738
            3276846327030465244
            3278288198550337613
            3282027553792969748
            3282101643140853108
            3284375942988909734
            3285083881192695143
            3285925056202951609
            3286151498928860835
            3293509104295223548
            3296614716387611432
            3300204063615674568
            3303308448618663629
            3303409753951180333
            3303589574866352112
            3303998282567167404
            3304001954932100425
            3304014987088344247
            3304235988611828606
            3304253235663119803
            3305043036174600411
            3305126521056077214
            3305953947354462549
            3307471131318671209
            3308528018342067152
            3309203196479859443
            3311441390877102000
            3311737201671455336
            3312777314783885237
            3313051597918146630
            3313228250479337613
            3314920251696307714
            3314937927565860835`.split(`
            `);
            if (ordersG.includes(orderId.trim())) {
                orderConArr.push('<span style="color:red;">查询到广浴隆被抓;</span>')
            } else {
                orderConArr.push('没查询到;');
            }
            orderCon.innerHTML = orderConArr.join('，');
        }, false)
        // 添加旺旺号
        qqAdd.querySelector('.j-order-search .ww-add').addEventListener('click', e => {
            const wwId = qqAdd.querySelector('.j-order-search .ww-id').value;
            const phone = $phone.value;
            const result = Tools.addWW(phone, wwId);
            if (result) alert('添加旺旺成功');
        }, false)
        // 删除旺旺号
        qqAdd.querySelector('.j-order-search .ww-del').addEventListener('click', e => {
            const wwId = qqAdd.querySelector('.j-order-search .ww-id').value;
            const phone = $phone.value;
            if (confirm('确定删除吗？')) {
                if (!DATA[phone]) {
                    alert('找不到对应的记录~')
                    return;
                    // DATA[phone] = [];
                }
                // console.log(wwId);
                const datas = DATA[phone].filter(data => data.pig_id || data.ww_exec != wwId);
                // console.log(datas);
                DATA[phone] = datas;
                storageData();
                alert('旺旺号删除成功');
                location.reload();
            }
        }, false)
        // 标注评价
        // Array.prototype.forEach.call(qqAdd.querySelectorAll('.j-comment'),($comment,index)=>{
        //     $comment.addEventListener('click',()=>{
        //         const is_comment = $comment.getAttribute('data-comment');
        //         const phone = $phone.value;
        //         const result = Tools.lastAddCommentByPhone(phone,is_comment);
        //         if(result)alert(`标注${is_comment=='1'?'已评':is_comment=='-1'?'默认评价':''}成功`);
        //     },false)
        // })
        // 添加qq
        qqAdd.querySelector('.add').addEventListener('click', (e) => {
            const qq = qqAdd.querySelector('.qq').value;
            const phone = $phone.value;
            // console.log(qq,phone);
            if (Tools.alertFuc({ qq, phone })) return;
            // if (!phone) return alert('手机号不能为空');
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return;
                // DATA[phone] = [];
            }
            // if (!qq) {
            //     alert('qq不能为空')
            //     return;
            // }
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
            const pig_type = $pigType.value;
            if (Tools.alertFuc({ phone, note, pig_type })) return;
            // console.log(qq,phone);
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return;
                // DATA[phone] = [];
            }
            DATA[phone].push({
                pig_phone: phone,
                pig_note: note,
                pig_type: pig_type,
                create_time: new Date().toLocaleString(),
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
            const pig_type = $pigType.value;
            const qq_exec_pre = qqAdd.querySelector('.qq_exec_pre').value;
            const shop_label = qqAdd.querySelector('.j-shop-id').value;
            const record = { pig_phone: phone, pig_qq: qq, pig_over_time: new Date().toLocaleString(), qq_exec_pre: qq_exec_pre, shop_label, pig_type };
            if (Tools.alertFuc({ shop_label, phone, qq, qq_exec_pre, pig_type })) return;
            // console.log(record);
            // return;
            if (!DATA[phone]) {
                alert('找不到对应的phone记录~')
                return;
                // DATA[phone] = [];
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
        const getCon = (arr,len) => {
            let str = '';
            const datas = Tools.getShortDatas(arr,len);
            datas.forEach(data=>{
                str += `<div>${typeof data === 'string' ? data : JSON.stringify(data)}</div>`;
            })
            return str;
        }
        const setCon = arr => {
            const con = getCon(arr);
            $con.innerHTML = con + '<div style="height:1px; background:#c2b7cd; margin-top: 10px;"></div>';
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
                let datas = DATA[phone];
                let table = getDataTable([datas])
                setCon([table, getCon(datas,3)]);
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
                        // 单手机
                        let datas = arr[0];
                        let table = getDataTable([datas])
                        setCon([table, getCon(datas,3)]);
                        // setCon(arr[0]);
                    } else {
                        // 多手机号
                        let str = getCon(arr);
                        let table = getDataTable(arr);
                        setCon([table + str]);
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
                        arr.forEach(datas => {
                            const qqs = findQqs(datas, qq);
                            if (qqs.length > 0) {
                                results.push(qqs);
                            } else {
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
        function copyToClipboard(text) {
            const domIpt = document.createElement('textarea');
            domIpt.style.position = 'absolute';
            domIpt.style.left = '-9999px';
            domIpt.style.top = '-9999px';
            document.body.appendChild(domIpt);
            domIpt.value = text;
            domIpt.select();
            document.execCommand('copy');
            document.body.removeChild(domIpt);
        }
        // 筛选做单过的qq号
        addEventListener($con, 'click', (e) => {
            const $btn = e.target;
            const $parent = $btn.parentNode;
            const qq = $btn.getAttribute('data-qq');
            const phone = $parent.querySelector('.j-phone').textContent;
            $btn.textContent = '已去除';
            $btn.style = 'color:gray;margin-left:10px;';
            copyToClipboard(qq);
            RDATA.addData(phone);
        }, '.j-remindPhone')
        // 点击copy
        addEventListener($con,'click',e=>{
            const $text = e.target;
            const text = $text.textContent;
            $text.style.cursor = 'pointer';
            $text.title='点击复制';
            copyToClipboard(text);
            const copyed = $text.getAttribute('data-copyed');
            if(copyed!=='1'){
                const $after = document.createElement('span');
                $after.style = 'color:gray;margin-left:3px;';
                $after.textContent = '已复制';
                $text.after($after);
            }
            $text.setAttribute('data-copyed','1');
        },'.j-copyText')
        function GatherQqs(cb = () => true, pig_type = 'TB') {
            let endTime = new Date(new Date().getTime() - 20 * 24 * 60 * 60 * 1000);
            let startTime = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
            const is_screen = qqAdd.querySelector('.j-screen').value;
            let DateRecords = [];
            const DatePhones = Object.keys(DATA);
            const getLastTypeData = (datas, pig_type) => {
                let result;
                for (let i = 0; i < datas.length; i++) {
                    const data = Tools.copyObj(datas[i]);
                    if (!data.pig_type) data.pig_type = 'TB';
                    if (data.pig_type == pig_type && data.pig_over_time) {
                        result = data;
                        break;
                    }
                }
                return result;
            }
            for (let phone of DatePhones) {
                const datas = DATA[phone];
                if (datas.length == 0) continue;
                let data = getLastTypeData(datas, pig_type);
                if (data) DateRecords.push(data);
            }
            DateRecords.sort((a, b) => {
                if (new Date(a.pig_over_time) > new Date(b.pig_over_time)) {
                    return -1;
                } else {
                    return 1;
                }
            })
            let records = [];
            DateRecords.forEach(record => {
                if (records.length < 5 && new Date(record.pig_over_time) < endTime) {
                    let datas = DATA[record.pig_phone];
                    const humanData = humanDatas(datas);
                    const notes = humanData.notes.join('');
                    const diffPhones = humanData.diffPhones;
                    if (
                        notes.indexOf('满月') == -1
                        && notes.indexOf('删订单') == -1
                        && diffPhones.length == 0
                        && !RDATA.isExist(record.pig_phone)
                        && cb(humanData)
                    ) {
                        if ((is_screen == '1' && (notes.indexOf('被抓') == -1 || notes.indexOf('已换号')!=-1)) || is_screen == '0') {
                            records.push(datas);
                        }
                    }
                }
            })
            // console.log(records);
            const table = getDataTable(records, { text: 'copy去除', className: 'j-remindPhone' });
            setCon([table]);
        }
        qqAdd.querySelector('.j-gatherQqs').addEventListener('click', () => {
            const pig_type = $pigType.value;
            GatherQqs(humanData => {
                return humanData.record_num >= 2;
            }, pig_type)
        }, false)
        qqAdd.querySelector('.j-gatherRegisterQqs').addEventListener('click', () => {
            const pig_type = $pigType.value;
            GatherQqs(humanData => {
                // 注册时间超过1个月 做单时间跟注册时间相隔1个月以上
                return new Date(humanData.record_time) - 30 * 24 * 60 * 60 * 10000 > new Date(humanData.register_time);
            }, pig_type)
        }, false)
        // 通过店铺找到做单数据
        qqAdd.querySelector('.j-gatherShop').addEventListener('click', () => {
            const arr = [];
            const shop_label = qqAdd.querySelector('.j-shop-id').value;
            const comment_sel = qqAdd.querySelector('.j-comment-sel').value;
            const phones = Object.keys(DATA);
            if (!shop_label) return;
            for (let phone of phones) {
                const datas = DATA[phone];
                if (trim(datas[0].shop_label) == trim(shop_label)) {
                    if((comment_sel === '' && !datas[0].is_comment) || (comment_sel && comment_sel==datas[0].is_comment)){
                        arr.push(datas[0]);
                    }
                }
            }
            arr.sort((a, b) => {
                if (new Date(a.pig_over_time) > new Date(b.pig_over_time)) {
                    return 1;
                } else {
                    return -1;
                }
            })
            if (arr.length == 0) return setCon(['没有找到做单记录']);
            // console.log(arr);
            const phoneDatas = [];
            const forLen = arr.length < 5 ? arr.length : 5;
            for (let i = 0; i < forLen; i++) {
                phoneDatas.push(DATA[arr[i].pig_phone]);
            }
            // console.log(phoneDatas);
            const table = getDataTable(phoneDatas, comment_sel===''?[{ text: '标注已评价', className: 'j-addComment',texted:"已评价",val:'1' },{ text: '标注默认评价', className: 'j-addComment',texted:'已默认评价',val:'-1' }]:comment_sel=='-1'?{ text: '标注已评价', className: 'j-addComment',texted:"已评价",val:'1' }:'');
            setCon([table]);
        }, false)
        // 标注已评跟默认评价按钮
        addEventListener($con, 'click', (e) => {
            const $btn = e.target;
            const $parent = $btn.parentNode;
            // const qq = $btn.getAttribute('data-qq');
            console.log($btn.getAttribute('data-datas'));
            const datas = JSON.parse($btn.getAttribute('data-datas').replaceAll("'",'"'));
            const phone = $btn.getAttribute('data-phone');
            $btn.textContent = datas.texted;
            $btn.style.color = 'gray';
            // console.log(qq,phone);
            Tools.lastAddCommentByPhone(phone,datas.val);
        }, '.j-addComment')
        {
            // 添加非手机记录
            const $addOtherRecordBtn = qqAdd.querySelector('.j-addOtherRecord');
            Tools.addRecord(() => {
                return $phone.value;
            }, $addOtherRecordBtn, '添加非手机记录');
            // .addEventListener('click',(e)=>{
            //     const $btn = e.target;
            //     console.log($btn);
            //     console.log($phone);
            //     const phone = $phone.value;
            //     Tools.addRecord(phone,$btn);
            //     // $btn.append(document.createElement('button'))
            // },false)
        }

    }
    AddQQDiv();
    // 格式化phone的做单数据格式
    // function formatePhoneTbDatas
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
        datas.forEach(data => {
            if (data.length > 0 && !arr.includes(data[0].pig_phone)) arr.push(trim(data[0].pig_phone));
        })
        return arr;
    }

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
    const cshLocal = (obj) => {
        Object.keys(obj).forEach(key => {
            localStorage.setItem(key, JSON.stringify(obj[key]));
        })
    }

    window.PIG = {
        Download,
        findNotes, findQqs, cshLocal
    }
})();
