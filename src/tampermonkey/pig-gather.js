// ==UserScript==
// @name         小猪平台-汇总数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  汇总数据，并持久化保存，1周自动下载一次
// @author       You
// @match        http://116.63.136.65/home/member/fangdan.html
// @match        http://www.mypig.com/home/member/fangdan.html
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Your code here...
    // {
    //     phone：[
    //         {pig_phone,ww_exec,is_del?:'1'} 做单旺旺号
    //         {pig_phone,pig_qq?,wx?,qq_exec_pre,pig_over_time,shop_label?:LABELS店铺类型,pig_type?:TB|JD:小猪做单类型,is_comment?:0没评|1已评|-1默认评,come_type?:COMETYPE来子哪里的单子,is_remind?:'-1'是否提醒,real_name:？真实姓名} 添加做单记录            
    //         {pig_phone,pig_note,create_time?,pig_type?} 添加备注
    //         {pig_phone,pig_qq} 添加不同的qq
    //         {pig_phone,wx,wx_name?} 添加不同的wx
    //         {pig_phone,real_name,wx_name} 收款码
    //         { pig_id, pig_phone, pig_qq, pig_register_time, pig_over_time, qq_exec_pre?, shop_label?,pig_type?:TB|JD ,is_comment?:0|1，is_remind?:'-1'是否提醒, real_name:？真实姓名} 正常小猪单
    //     ]
    // }
    // 获取已完成小猪数据
    const DATA = localStorage.getItem('completeOrders') ? JSON.parse(localStorage.getItem('completeOrders')) : {};
    // 是否自定义
    const is_custom = true;
    const COMETYPE = [
        { name: 'pig', fix: '', value: 'pig' },
        { name: 'A97-欢乐购秒杀1群', fix: 'QQ', value: '626195966' },
        { name: 'A97-欢乐购秒杀2群', fix: 'QQ', value: '244917614' },
        { name: 'A97-欢乐购秒杀11群', fix: 'QQ', value: '1074927054' },
        { name: 'A97-欢乐购火箭🚀1群', fix: 'QQ', value: '272916421' },
        { name: 'A97-欢乐购火箭🚀3群', fix: 'QQ', value: '325019211' },
    ];
    const QQS = {
        '31': {
            text: 'QQ-小艾-1',
            color: 'blueviolet',
        },
        '30': {
            text: 'QQ-小欣-2',
            color: 'red',
        },
        '21': {
            text: 'QQ-小菜-5',
            color: 'black',
        },
        '20': {
            text: 'QQ-小云-3',
            color: 'rebeccapurple',
        },
        '54': {
            text: 'QQ-小韵-4',
            color: 'fuchsia'
        },
        'a847457846': {
            text: '微信-note',
            color: '#004cff'
        }
    }
    const storageData = () => {
        localStorage.setItem('completeOrders', JSON.stringify(DATA));
    }
    // 店铺数据
    const LABELS = {
        datas: [
            {
                label: '万阁',
                options: ['痔疮6', '肛裂5', '肛瘘8'],
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
        // {phone:{order_reminder:time,comment_reminder:time}}[]
        datas: {},
        setDatas: (datas) => {
            RDATA.datas = datas;
            RDATA.storageData();
        },
        addOrderReminder: (phone) => {
            const time = RDATA.datas[phone] || {};
            const reminder = { ...time, ...{ order_reminder: new Date().toLocaleString() } };
            RDATA.addData(phone, reminder);
        },
        addCommentReminder: (phone) => {
            const time = RDATA.datas[phone] || {};
            const reminder = { ...time, ...{ comment_reminder: new Date().toLocaleString() } };
            RDATA.addData(phone, reminder);
        },
        addData: (phone, reminder) => {
            RDATA.datas[phone] = reminder;
            RDATA.storageData();
        },
        isExist: (phone, reminder = 'order_reminder') => {
            // 查询是否暂时不再提醒 -1:不再提醒
            if (DATA[phone] && DATA[phone][0].is_remind == '-1') return true;
            // 查询是否记录多少天不再提醒
            if (RDATA.datas[phone] && RDATA.datas[phone][reminder]) return true;
            return false;
        },
        isExpireTime: (time, reminder = 'order_reminder') => {
            if (!time) return false;
            // order_reminder 14天过期，comment_reminder 5天过期
            if (new Date(time) > new Date(new Date().getTime() - (reminder === 'order_reminder' ? 14 : 5) * 24 * 60 * 60 * 1000)) {
                return false;
            }
            return true;
        },
        getDatas: () => {
            let datas = localStorage.getItem('remindDatas') ? JSON.parse(localStorage.getItem('remindDatas')) : {};
            const results = {};
            const phones = Object.keys(datas);
            if (phones.length > 0) {
                phones.forEach(phone => {
                    const { order_reminder, comment_reminder } = datas[phone];
                    if (order_reminder && !RDATA.isExpireTime(order_reminder, 'order_reminder')) {
                        if (!results[phone]) results[phone] = {};
                        results[phone].order_reminder = order_reminder;
                    }
                    if (comment_reminder && !RDATA.isExpireTime(comment_reminder, 'comment_reminder')) {
                        if (!results[phone]) results[phone] = {};
                        results[phone].comment_reminder = comment_reminder;
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
            // 判断是否有pig_phone数据是否存在
            const pig_phone = obj['pig_phone'];
            if (keys.includes('pig_phone')) {
                if (!DATA[pig_phone]) {
                    alert('不存在做单数据');
                    result = true;
                }
            }
            return result;
        },
        copyObj: (obj) => {
            return JSON.parse(JSON.stringify(obj));
        },
        // 节流函数
        throttle: (fn, delay) => {
            let timer = null;
            let lastTime = 0;

            return function () {
                const currentTime = new Date().getTime();
                const remainingTime = delay - (currentTime - lastTime);
                const context = this;
                const args = arguments;

                clearTimeout(timer);

                if (remainingTime <= 0) {
                    fn.apply(context, args);
                    lastTime = currentTime;
                } else {
                    timer = setTimeout(() => {
                        fn.apply(context, args);
                        lastTime = new Date().getTime();
                    }, remainingTime);
                }
            };
        },
        // 判断是否是一个日期字符串
        isDateValid: (...val) => {
            return !Number.isNaN(new Date(...val).valueOf());
        },
        // 删除DATA的整个记录data
        deleteData:(pig_phone)=>{
            if(Tools.alertFuc({pig_phone}))return false;
            if (confirm(`确定删除(${pig_phone})吗？`)) {
                delete DATA[pig_phone];
                storageData();
                return true;
            }else{
                return false;
            }
        },
        // 判断是否可删的key
        isDelKey: (data, key) => {
            let result = true;
            if (!data || !key) return false;
            const keys = Object.keys(data);
            // 必须是is里面的字段
            const is = ['pig_phone', key, 'is_del'];
            for (let k of keys) {
                if (is.includes(k)) {
                    result = true;
                } else {
                    result = false;
                    break;
                }
            }
            // console.log(result,keys);
            return result;
        },
        // 添加字段 isRepeat:false 不能重复添加
        addKeyValue: (pig_phone, key, value, middleFuc = () => true, otherKeysFuc = () => { return {} }, spliceIndex = DATA[pig_phone].length, isRepeat = false) => {
            if (Tools.alertFuc({ pig_phone, key, value })) return false;
            // if (!DATA[pig_phone]) return alert('不存在小猪数据');
            if (!isRepeat) {
                const result = Tools.isKeyValueByDatas(DATA[pig_phone], key, value, true);
                // console.log(result,DATA[pig_phone]);
                if (result) {
                    alert(`不能重复添加${key}=${value}`);
                    return false;
                }
            }
            // 中间件函数
            if (!middleFuc()) return false;
            // 添加key=value数据，默认在最后添加一个元素
            DATA[pig_phone].splice(spliceIndex, 0, {
                pig_phone: pig_phone,
                [key]: value,
                create_time: new Date().toLocaleString(),
                ...otherKeysFuc(),
            })
            storageData();
            // console.log(DATA[pig_phone]);
            return true;
        },
        // 删除字段
        delKeyValue: (pig_phone, key, value, middleFuc = () => true, otherKeysFuc = () => false, isJudgeDel = true) => {
            if (Tools.alertFuc({ pig_phone, key, value })) return false;

            if (isJudgeDel) {
                // 判断是否可删
                const datas = DATA[pig_phone];
                const { data } = Tools.isKeyValueByDatas(datas, key, value);
                if (data && !Tools.isDelKey(data, key)) {
                    alert(`不可删除字段${JSON.stringify(data)}`);
                    return false;
                }
            }

            // 中间件函数
            if (!middleFuc()) return false;

            if (confirm('确定删除吗？')) {
                const datas = DATA[pig_phone].filter(data => data.pig_id || data[key] != value || otherKeysFuc(data));
                // console.log(datas);
                DATA[pig_phone] = datas;
                storageData();
                // alert(`${key}=${value}删除成功`);
                return true;
            }
        },
        // 修改data
        modifyData:(pig_phone,valueObj={},judgeFuc=(data)=>{return false;})=>{
            if(Tools.alertFuc({pig_phone}))return false;
            const datas = DATA[pig_phone];
            datas.forEach((data,index)=>{
                if(judgeFuc(data,index)){
                    Object.assign(DATA[pig_phone][index], valueObj);
                }
            })
            storageData();
            return true;
        },
        // 在datas数据中判断是否存在key=value，存在则返回data
        isKeyValueByDatas: (datas, key, value, isEqual = false) => {
            if (Tools.alertFuc({ datas, key, value })) return false;
            // function escapeRegExp(string) {
            // return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 表示匹配的内容
            // }
            // // 自动转义特殊字符
            // const escapedValue = escapeRegExp(value);
            // 创建正则表达式
            const regexp = new RegExp(value);
            let result = false;
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                const val = data[key];
                if (val && isEqual ? val == value : regexp.test(val)) {
                    result = { data, index: i };
                    break;
                }
            }
            return result;
        },
        // key=value搜索phone
        searchKeyValue: (key, value) => {
            if (Tools.alertFuc({ key, value })) return false;
            let phone_arr = [];
            for (let phone in DATA) {
                const datas = DATA[phone];
                if (Tools.isKeyValueByDatas(datas, key, value)) phone_arr.push(phone);
            }
            // 去重
            phone_arr = [...new Set(phone_arr)];
            return phone_arr;
        },
        // 通过datas找到所有的keys=data[] | string[]
        findKeysByDatas: (datas, key, otherJudge = () => true, is_complete = false) => {
            let arr = [];
            datas.forEach(data => {
                if (data[key] && otherJudge(data)) {
                    arr.push(is_complete ? data : data[key]);
                }
            })
            // 去重
            return arr = [...new Set(arr)];
        },
        // 添加真实姓名
        addRealName: (pig_phone, real_name) => {
            if (Tools.alertFuc({ pig_phone, real_name })) return false;
            return Tools.modifyDataToLastRecord(pig_phone, { real_name });
        },
        // 找到真实姓名
        findRealNamesByDatas: (datas, otherJudge, is_complete) => {
            // let real_name_arr = [];
            // for (let data of datas) {
            //     if (data.real_name) {
            //         real_name_arr.push(data.real_name);
            //     }
            // }
            // // 去重
            // return real_name_arr = [...new Set(real_name_arr)];
            return Tools.findKeysByDatas(datas, 'real_name', otherJudge, is_complete);
        },
        // 添加真实姓名对应的微信名字
        addWxName: (pig_phone, wx_name, real_name) => {
            if (Tools.alertFuc({ pig_phone, wx_name })) return false;
            // 匹配出来真实的微信姓名跟真实姓名，"微信名字(真实姓名)"的格式
            let wx_name_tmp = wx_name;
            let real_name_tmp = real_name;
            const reg = /(.+?)\((.+?)\)/;
            const result_reg = reg.exec(wx_name.replace(/\*+/g,'.+?'));
            if(result_reg){
                wx_name_tmp = result_reg[1];
                real_name_tmp = result_reg[2];
                // console.log(result_reg);
                // 找到真实的姓名
                let real = Tools.findKeysByDatas(DATA[pig_phone],'real_name',(data)=>{
                    // 把多个**替换下
                    let tmp = real_name_tmp.replace(/\*+/g,'.+?');
                    // console.log(tmp);
                    return new RegExp(tmp).exec(data.real_name);
                },false);
                // console.log(real);
                if(real.length>0){
                    real_name_tmp = real[0];
                }else{
                    alert('没有找到真实姓名');
                    return false;
                }

            }
            return Tools.addKeyValue(pig_phone, 'wx_name', wx_name_tmp, ()=>{
                // 判断不能重复添加
                let result = true;
                for(let data of DATA[pig_phone]){
                    if(data.wx_name && data.real_name == real_name_tmp){
                        alert('一个真实姓名对应一个wx名字');
                        result = false;
                        break;
                    }
                }
                return result;
            }, () => {
                return { real_name:real_name_tmp };
            },undefined,true)
        },
        // 删除真实姓名对应的微信名字
        delRealNameWxName: (pig_phone, wx_name) => {
            if (Tools.alertFuc({ pig_phone, wx_name })) return false;
            return Tools.delKeyValue(pig_phone, 'wx_name', wx_name, undefined, (data)=>!data.real_name, false);
        },
        // 找到所有的微信姓名return {real_name:wx_name}
        findRealNameWxNamesByDatas: (datas) => {
            const result = {};
            const wxNames = Tools.findKeysByDatas(datas, 'wx_name', (data) => data.real_name, true);
            wxNames.forEach(data => {
                result[data.real_name] = data.wx_name;
            })
            return result;
        },
        // 添加旺旺号
        addWW: (pig_phone, ww_exec) => {
            // if (Tools.alertFuc({ pig_phone, ww_exec })) return false;
            // if (!DATA[pig_phone]) return alert('不存在小猪数据');
            // // 判断是否已经有旺旺
            // const datas = DATA[pig_phone];
            // let tx = false;
            // for (let data of datas) {
            //     if (data.ww_exec && data.ww_exec == ww_exec) tx = true;
            // }
            // if (tx == true) return alert('已经添加过旺旺号了');
            // DATA[pig_phone].push({ pig_phone: pig_phone, ww_exec: ww_exec });
            // storageData();
            // return true;
            return Tools.addKeyValue(pig_phone, 'ww_exec', ww_exec);
        },
        // 删除旺旺
        delWW: (pig_phone, ww_exec) => {
            // const wwId = $ww.value;
            // const phone = $phone.value;
            // if (confirm('确定删除吗？')) {
            //     if (!DATA[phone]) {
            //         alert('找不到对应的记录~')
            //         return;
            //         // DATA[phone] = [];
            //     }
            //     // console.log(wwId);
            //     const datas = DATA[phone].filter(data => data.pig_id || data.ww_exec != wwId);
            //     // console.log(datas);
            //     DATA[phone] = datas;
            //     storageData();
            //     alert('旺旺号删除成功');
            // }
            return Tools.delKeyValue(pig_phone, 'ww_exec', ww_exec);
        },
        // 添加倒数第二个旺旺号
        addWWBackSecond: (pig_phone, ww_exec) => {
            // if (Tools.alertFuc({ pig_phone, ww_exec })) return false;
            // if (!DATA[pig_phone]) return alert('不存在小猪数据');
            // // 判断是否已经有旺旺
            // const datas = DATA[pig_phone];
            // let tx = false;
            // let second;
            // for (let index in datas) {
            //     const data = datas[index];
            //     if (data.ww_exec && data.ww_exec == ww_exec) tx = true;
            //     if (data.ww_exec) second = index;
            // }
            // if (tx == true) return alert('已经添加过旺旺号了');
            // if (!second) return alert('没有添加过旺旺号');
            // DATA[pig_phone].splice(second, 0, { pig_phone: pig_phone, ww_exec: ww_exec });
            // storageData();
            // return true;
            const datas = DATA[pig_phone];
            let second;
            for (let index in datas) {
                const data = datas[index];
                if (data.ww_exec) second = index;
            }
            return Tools.addKeyValue(pig_phone, 'ww_exec', ww_exec, undefined, undefined, second);
        },
        // 通过旺旺找到phones
        findPhonesByWW: (ww_exec) => {
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
        // 找到所有的旺旺号
        findWwsByDatas: (datas = [], is_complete = false) => {
            let arr = [];
            datas.forEach(data => {
                if (data.ww_exec) {
                    arr.push(is_complete ? data : data.ww_exec);
                }
            })
            return arr;
        },
        // 通过phone找到所有的ww
        findWwsByPhones: (phones) => {
            let arr = [];
            phones.forEach(phone => {
                arr = arr.concat(Tools.findWwsByDatas(DATA[phone]));
            })
            return arr;
        },
        // 判断ww是否被抓
        isDelWwByDatas: (ww, datas = []) => {
            let result = false;
            if (datas.length > 0) {
                datas.forEach(data => {
                    if (data.pig_note && new RegExp(`\（${ww}\）.+?被抓`).exec(data.pig_note)) {
                        result = true;
                    }
                })
            }
            return result;
        },
        // 添加不同的qq
        addQq: (pig_phone, pig_qq) => {
            // if (Tools.alertFuc({ pig_phone, pig_qq })) return false;
            // if (!DATA[pig_phone]) return alert('不存在小猪数据');
            // DATA[pig_phone].push({
            //     pig_phone: pig_phone,
            //     pig_qq: pig_qq,
            // })
            // storageData();
            // return true;

            return Tools.addKeyValue(pig_phone, 'pig_qq', pig_qq);
        },
        // 删除qq
        delQq: (pig_phone, pig_qq) => {
            return Tools.delKeyValue(pig_phone, 'pig_qq', pig_qq);
        },
        // 找到所有qqs
        findQqsByDatas: (datas, qq) => {
            const arr = [];
            datas.forEach(data => {
                if (data.pig_qq && data.pig_qq != qq && !arr.includes(data.pig_qq)) {
                    arr.push(data.pig_qq);
                }
            })
            return arr;
        },
        // 判断是否可删的联系方式
        // isDelContact: (data, key) => {
        //     let result = false;
        //     if (!data || !key) return false;
        //     const keys = Object.keys(data);
        //     // 必须是is里面的字段
        //     const is = ['pig_phone', key, 'is_del'];
        //     for (let k of keys) {
        //         if (is.includes(k)) {
        //             result = true;
        //         } else {
        //             result = false;
        //             break;
        //         }
        //     }
        //     // console.log(result,keys);
        //     return result;
        // },
        // 添加联系方式
        // addContact: (pig_phone, key, value) => {
        //     // if (Tools.alertFuc({ pig_phone, key, value })) return false;
        //     // if (!DATA[pig_phone]) return alert('不存在小猪数据');
        //     // // 判断是否重复添加
        //     // DATA[pig_phone].push({
        //     //     pig_phone: pig_phone,
        //     //     [key]: value,
        //     // })
        //     // storageData();
        //     // console.log(DATA[pig_phone]);
        //     // return true;

        //     return Tools.addKeyValue(pig_phone, key, value);
        // },
        // 删除联系方式
        // delContact: (pig_phone, key, value) => {
        //     // if (Tools.alertFuc({ pig_phone, key, value })) return false;
        //     // if (!DATA[pig_phone]) return alert('不存在小猪数据');
        //     // if (confirm('确定删除吗？')) {
        //     //     const datas = DATA[pig_phone].filter(data => {
        //     //         if (data[key] == value && Tools.isDelContact(data, key)) return false;
        //     //         return true;
        //     //     });
        //     //     // console.log(datas);
        //     //     DATA[pig_phone] = datas;
        //     //     storageData();
        //     //     // console.log(DATA[pig_phone]);
        //     //     // alert(`${key}=${value}删除成功`);
        //     //     return true;
        //     // }
        //     return Tools.delKeyValue(pig_phone,key,value)
        // },
        // 找到所有的联系方式
        // findContactsByDatas: (datas, key, excludeValue) => {
        //     const arr = [];
        //     datas.forEach(data => {
        //         if (data[key] && data[key] != excludeValue && !arr.includes(data[key])) {
        //             arr.push(data[key]);
        //         }
        //     })
        //     // console.log(arr);
        //     return arr;
        // },
        // 添加wx
        addWx:(pig_phone,wx)=>{
            // Tools.addContact(pig_phone,'wx',wx);
            return Tools.addKeyValue(pig_phone,'wx',wx);
        },
        // 删除wx
        delWx:(pig_phone,wx)=>{
            return Tools.delKeyValue(pig_phone,'wx',wx,undefined,undefined,false);
        },
        // 给wx添加wx_name
        addWxNameByWx:(pig_phone,wx,wx_name)=>{
            return Tools.modifyData(pig_phone,{wx_name},(data,index)=>{
                return data.wx == wx;
            })
        },
        // 找到所有的wx对应的微信名字
        findWxWxNamesByDatas:(datas)=>{
            const wxs_arr = Tools.findKeysByDatas(datas,'wx',undefined,true);
            const results = {};
            wxs_arr.forEach(wx_obj=>{
                if(wx_obj.wx){
                    results[wx_obj.wx]=wx_obj.wx_name;
                }
            })
            return results;
        },
        // 找到所有的wxs
        findWxsByDatas: (datas,isHaveWxNameAdd=false) => {
            const wx_wx_names = Tools.findWxWxNamesByDatas(datas);
            return Object.keys(wx_wx_names).map(wx=>{
                if(wx_wx_names[wx] && isHaveWxNameAdd){
                    return `${wx}${isHaveWxNameAdd?`<span style="color:gray;font-size:12px;">（${wx_wx_names[wx]}）</span>`:''}`;
                }
                return wx;
            })
        },
        // 添加备注
        addNote: (pig_phone, pig_note, pig_type) => {
            if (Tools.alertFuc({ pig_type })) return false;
            return Tools.addKeyValue(pig_phone, 'pig_note', pig_note, undefined, () => {
                return {
                    pig_type,
                }
            });
        },
        // 删除备注
        delNote: (pig_phone, pig_note, pig_type) => {
            if (Tools.alertFuc({ pig_type })) return false;
            return Tools.delKeyValue(pig_phone, 'pig_note', pig_note, undefined, (data) => {
                if ((!data['pig_note'] && pig_note!='TB') && data['pig_type'] != pig_type) return true;
                return false;
            },false)
        },
        // 找到phone数据里面的note数据obj
        findNotesByDatas: (datas, pig_type = 'TB') => {
            const arr = [];
            datas.forEach(data => {
                const obj = Tools.copyObj(data);
                if (!obj.pig_type) obj.pig_type = 'TB';
                if (obj.pig_type == pig_type && obj.pig_note) arr.push(obj);
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
        lastAddCommentByPhone: (phone, is_comment = '1') => {
            if (Tools.alertFuc({ phone, is_comment })) return false;
            if (!DATA[phone]) {
                alert('找不到对应的记录~')
                return false;
                // DATA[phone] = [];
            }
            DATA[phone][0].is_comment = is_comment;
            storageData();
            return true;
        },
        // 添加做单记录
        addRecord: (phone) => {
            if (Tools.alertFuc({ phone })) return;
            if (DATA[phone]) {
                alert('已经存在记录~');
                return false;
            }
            DATA[phone] = [];
            storageData();
            return true;
        },
        // 添加做单记录按钮
        addRecordBtn: (phone, parentNode, text,qq) => {
            const button = document.createElement('button');
            button.className = 'search_btn';
            button.innerHTML = text || "添加记录";
            button.addEventListener('click', () => {
                if (typeof phone == 'function') phone = phone();
                const result = Tools.addRecord(phone);
                if(qq) Tools.addQq(phone,qq);
                if (result) alert('添加记录成功~');
            }, false)
            if (parentNode) {
                parentNode.append(button);
            }
            return button;
        },
        // 添加新做单记录并添加qq和旺旺
        addRecordQqWw: (phone, qq, ww_exec) => {
            if (Tools.alertFuc({ phone, qq, ww_exec })) return false;
            //添加自定义做单记录
            if (Tools.addRecord(phone) && Tools.addQq(phone, qq) && Tools.addWW(phone, ww_exec)) {
                return true;
            }
            return false;
        },
        // 找到最后一个字段
        findLastKeyValuesByDatas: (datas, keys = []) => {
            let obj = {};
            for (let data of datas) {
                keys.forEach(key => {
                    if (data[key] && !obj[key]) {
                        obj[key] = data[key];
                    }
                })
                if (Object.keys(obj).length == keys.length) {
                    break;
                }
            }
            return obj;
        },
        // 找到注册时间
        findRegisterTimeByDatas: (datas) => {
            return Tools.findLastKeyValuesByDatas(datas, ['pig_register_time']).pig_register_time;
            // let register_time = '';
            // for (let i = 0; i < datas.length; i++) {
            //     if (datas[i].pig_register_time) {
            //         register_time = datas[i].pig_register_time;
            //         break;
            //     }
            // }
            // return register_time;
        },
        // 获取注册时间
        findRegisterTimeByTr: (tr) => {
            // let register_time = '';
            // if(!tr)return register_time;
            // const result = tr.match(/!--\s+?<td>(.+?)<\/td>/);
            // if(result){
            //     const time = trim(result[1]);
            //     if(Tools.isDateValid(time)){
            //         register_time = time;
            //     } 
            // }
            // return register_time;
        },
        // 判断是否是做单记录
        isRecord: (data) => {
            if (data.pig_over_time) return true;
            return false;
        },
        // 汇总phone数据里面的店铺数据
        findShopLabelsByDatas: (datas, switch_time, record_color) => {
            const results = [];
            datas.forEach((data, index) => {
                // 添加已换号
                if (switch_time) {
                    // 3天误差
                    if (new Date(new Date(switch_time).getTime() - 3 * 24 * 60 * 60 * 1000) > new Date(data.pig_over_time)) {
                        results.unshift('<span style="color:red;">已换号</span>');
                        switch_time = undefined;
                    }
                }
                if (data.shop_label) {
                    const shopLabels = data.shop_label.split('-');
                    // 合并店铺
                    if (datas[index + 1] && datas[index + 1].shop_label && datas[index + 1].shop_label.indexOf(shopLabels[0]) !== -1) {
                        results.unshift((record_color && index === 0) ? `<span style="color:${record_color}">${shopLabels[1]}</span>` : shopLabels[1]);
                    } else {
                        results.unshift((record_color && index === 0) ? `<span style="color:${record_color}">${data.shop_label}</span>` : data.shop_label);
                    }
                }
            })
            return results;
        },
        // 找到phone对应的pig_type得做单数据
        getDatasByPigType: (Datas = [], pig_type = 'TB') => {
            const datas = Tools.copyObj(Datas);
            return datas.filter((data, index) => {
                if (!data.pig_type) data.pig_type = 'TB';
                if (Tools.isRecord(data) && data.pig_type == pig_type) {
                    // 筛选出来连续做单错误记录
                    if (datas[index - 1] && new Date(new Date(data.pig_over_time).getTime() + 2 * 24 * 60 * 60 * 1000) > new Date(datas[index - 1].pig_over_time)) {
                        return false;
                    }
                    return true;
                }
                return false;
            });
        },
        // 缩短记录
        getShortDatas: (datas, len) => {
            const arr = [];
            let index = 0;
            datas.forEach(data => {
                if (arr.length >= len) {
                    if (!Tools.isRecord(data)) {
                        arr.push(data);
                    } else {
                        index++;
                    }
                } else {
                    arr.push(data);
                }
            })
            if (index > 0) {
                arr.splice(len, 0, `<span style="color:gray;">.......此处省略${index}个记录........</span>`);
            }
            return arr;
        },
        // 整理DATA里面的被抓旺旺
        formateWwFromData: () => {
            for (let phone in DATA) {
                // if (phone != '17302314464') continue;
                const datas = DATA[phone];
                const wws = Tools.findWwsByDatas(datas, true);
                const notes = Tools.findNotesByDatas(datas);
                // console.log(wws, notes);
                if (wws.length > 0) {
                    wws.forEach(wwObj => {
                        const ww = wwObj.ww_exec;
                        if (!wwObj.is_del && Tools.isDelWwByDatas(ww, notes)) {
                            DATA[phone] = datas.map(data => {
                                if (data.ww_exec == ww) {
                                    data.is_del = '1';
                                }
                                return data;
                            })
                        }
                    })
                }
            }
            storageData();
        },
        // 修改最后一个记录
        modifyDataToLastRecord: (phone, obj = {}) => {
            Object.assign(DATA[phone][0], obj);
            storageData();
            return true;
        },
        // 不再提醒
        noRemind: (phone) => {
            DATA[phone][0].is_remind = '-1';
            storageData();
        },
        // 通过keyword找到phone搜索范围qq,phone,note,ww
        findPhonesByKeyword: (keyword) => {
            // console.log(keyword);
            const results = [];
            if (!keyword) return results;
            for (let phone in DATA) {
                const datas = DATA[phone];
                datas.forEach(data => {
                    if (data.pig_qq == keyword || data.pig_phone == keyword || data.ww_exec == keyword || data.wx == keyword || data.wx_name == keyword || (data.pig_note && data.pig_note.indexOf(keyword) != -1)) {
                        if (!results.includes(phone)) results.push(phone);
                    }
                })
            }
            return [...new Set(results)];
        },
        // 通过keyword找到所有keyword返回qq,phone,ww,wx_name数组
        findAllKeywordByKeyword: (keyword) => {
            const phones = Tools.findPhonesByKeyword(keyword);
            // console.log(phones);
            const arr = [];
            phones.forEach(phone => {
                const datas = DATA[phone];
                datas.forEach(data => {
                    if (data.pig_qq && !arr.includes(data.pig_qq)) arr.push(data.pig_qq);
                    if (data.pig_phone && !arr.includes(data.pig_phone)) arr.push(data.pig_phone);
                    if (data.ww_exec && !arr.includes(data.ww_exec)) arr.push(data.ww_exec);
                    if (data.wx && !arr.includes(data.wx)) arr.push(data.wx);
                    if (data.wx_name && !arr.includes(data.wx_name)) arr.push(data.wx_name);
                })
            })
            // console.log(arr);
            return [...new Set(arr)];
        },
        // 全能搜索得到phone keywords=[qq,phone,ww]
        almightySearch: (keywords = []) => {
            let result = [];
            if (keywords.length == 0) return result;
            //所有的关键字
            let arr = [];
            keywords.forEach(keyword => {
                arr = arr.concat(Tools.findAllKeywordByKeyword(keyword));
            })
            // 去重
            arr = [...new Set(arr)];
            // console.log(arr);
            arr.forEach(keyword => {
                result = result.concat(Tools.findPhonesByKeyword(keyword));
            })
            // 去重
            result = [...new Set(result)];
            // console.log(result);
            return result;
        },
        //找到做单渠道name
        findNameByComeTypeValue: (value) => {
            let result = value;
            COMETYPE.forEach(come_type => {
                if (come_type.value == value) result = come_type.name;
            })
            return result;
        },
        // 找到select的默认数据
        findDefaultValueBySelect: ($select) => {
            const $option_default = $select.querySelector('option[selected]');
            if ($option_default) {
                return $option_default.getAttribute('value');
            }
            return $select.querySelector('option:nth-child(1)').getAttribute('value');
        },
        // 提醒用户出问题
        remindText:(datas)=>{
            const remind_text_arr = ['骗子','不给单','不再给单','拉黑','可疑','黑名单','注意'];
            let remind_text = [];
            let json = JSON.stringify(datas);
            remind_text_arr.forEach(text=>{
                if(json.includes(text))remind_text.push(text);
            })
            return remind_text;
        }
    }
    // 获得每个tr数据
    const getTrData = ($tr) => {
        // console.log($tr);
        const pig_id = $tr.querySelector('td:nth-child(1)').textContent;
        const pig_title = $tr.querySelector('td:nth-child(2)').textContent;
        const pig_phone = trim($tr.querySelector('td:nth-child(5)').textContent);
        const pig_qq = trim($tr.querySelector('td:nth-child(9)').textContent);
        const pig_register_time = trim($tr.querySelector('td:nth-child(10)').textContent);
        // const pig_register_time = Tools.findRegisterTimeByTr($tr.innerHTML);
        const pig_over_time = $tr.querySelector('td:nth-child(14)').textContent;
        const pig_type = Tools.getPigType($tr.querySelector('td:nth-child(3)').textContent);
        const real_name = trim($tr.querySelector('td:nth-child(6)').textContent);


        let result = { pig_id, pig_phone, pig_qq, pig_over_time, pig_register_time, pig_type, real_name };
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
        Tools.formateWwFromData();
        storageData();
    }
    if(!is_custom){
        getData();
    }else{
        Tools.formateWwFromData();
        storageData();
    }

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
        if ((new Date().getTime() - 1 * 24 * 60 * 60 * 1000) > new Date(localStorage.getItem('downloadTime')).getTime() || new Date(localStorage.getItem('downloadTime')).getDate() != new Date().getDate()) {
            Download();
        }
    } else {
        Download();

    }

    // 人性化的做单记录数据
    const humanDatas = (datas, qq = "1", pig_type = 'TB') => {
        const pig_phone = datas.length > 0 && datas[0].pig_phone;
        // 备注数据
        let notes = Tools.findNotesByDatas(datas, pig_type);
        // pig_type做单数据
        let records = Tools.getDatasByPigType(datas, pig_type);
        // 找到所有的qq号
        let qqs = Tools.findQqsByDatas(datas, qq);
        // 找到不同的手机号
        // let diffPhones = findDiffPhonesByDatas(datas);
        let diffPhones = Tools.almightySearch([pig_phone]).filter(phone => phone != pig_phone);
        // 找到真实姓名
        const real_name_arr = Tools.findRealNamesByDatas(datas);
        // 找到注册时间
        let register_time = Tools.findRegisterTimeByDatas(records);
        // 找到真实姓名对应的微信名字s
        const wx_names = Tools.findRealNameWxNamesByDatas(datas) || {};
        // 提醒文本
        const remind_texts = Tools.remindText(datas);
        function formateDatasByPigType(datas, pig_type) {
            const records = Tools.getDatasByPigType(datas, pig_type);
            // 备注数据
            let notes = Tools.findNotesByDatas(datas, pig_type);
            // 记录颜色
            const record_color = records.length > 0 && records[0].qq_exec_pre && QQS[records[0].qq_exec_pre].color || '';
            // 切换时间
            let switch_time;
            notes.forEach(note => {
                if (note.pig_note && note.pig_note.indexOf('已换号') !== -1) {
                    switch_time = note.create_time;
                }
            })
            // 汇总店铺做单记录
            let shopLabels = Tools.findShopLabelsByDatas(records, switch_time, record_color);
            // console.log(records);
            return {
                datas: records,
                record_time: records.length > 0 && records[0].pig_over_time || '',
                record_qq: records.length > 0 && records[0].qq_exec_pre && QQS[records[0].qq_exec_pre].text || '',
                record_color: record_color,
                record_num: records.length,
                record_shop_label_last: records.length > 0 && (records[0].shop_label || ''),
                record_shop_labels: shopLabels.join('-'),
                record_come_type: records.length > 0 ? records[0].come_type || 'pig' : '',
                record_comment: records.length > 0 && records[0].is_comment,
                notes: notes.map(note => note.pig_note),
            }
        }
        // 找到旺旺账号obj
        const wws = Tools.findWwsByDatas(datas, true);
        const wws_html = wws.reduce((a, b) => {
            return a + (b.is_del ? `<del class="j-copyText" style="color:gray;display:block;">${b.ww_exec}</del>` : `<p class="j-copyText">${b.ww_exec}</p>`);
        }, '');
        // 找到所有的wxs
        const wxs = Tools.findWxsByDatas(datas,true);
        return {
            phone: datas.length > 0 && datas[0].pig_phone,
            real_names: real_name_arr,
            qqs: qqs,
            notes: notes.map(note => note.pig_note),
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
            wwExecs: wws.map(ww => ww.ww_exec),
            wws: wws,
            wws_html: wws_html,
            wxs: wxs,
            wx_names: wx_names,
            remind_texts,remind_texts,
        }
    }

    function trim(str) {
        if (!str) return str;
        // str = str.replace(/\ +/g, '');
        // str = str.replace(/[\r\n\t]/g, '');
        str = str.trim();
        return str;
    }
    const formatTr = ($tr, phone_index = 5, qq_index = 8, date_index = 13, type) => {
        // console.log($tr);
        const $phone = $tr.querySelector(`td:nth-child(${phone_index})`);
        const phone = trim($phone.textContent);
        const $qq = $tr.querySelector(`td:nth-child(${qq_index})`);
        const qq = trim($qq.textContent);
        const pig_id = trim($tr.querySelector(`td:nth-child(${type == 3 ? 2 : 1})`).textContent);
        const pig_type = Tools.getPigType(trim($tr.querySelector(`td:nth-child(${type == 3 ? 4 : 3})`).textContent));
        const $realName = $tr.querySelector(`td:nth-child(${type == 5 ? (phone_index + 1) : (qq_index - 1)})`);
        const real_name = trim($realName.textContent);
        // const pig_register_time = Tools.findRegisterTimeByTr($tr.innerHTML);
        const $pig_task_content = $tr.querySelector(`td:nth-child(${date_index - 1})`);
        const pig_task_content = trim($pig_task_content.textContent);
        const $pig_task_title = $tr.querySelector(`td:nth-child(${type == 3 ? 3 : 2})`);
        const pig_task_title = trim($pig_task_title.textContent);
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
            // 注册时间显示
            // const register_time_p = document.createElement('p');
            // register_time_p.innerHTML = `<p style="color:red;">注册时间：${pig_register_time}</p>`;
            // if(pig_register_time)$tr.querySelector(`td:nth-child(${qq_index+2})`).append(register_time_p);
            // 任务内容缩短
            if (pig_task_content.length > 100) {
                // 容错判断字数多的就是任务内容
                $pig_task_content.innerHTML = `<p title="${pig_task_content}">${pig_task_content.slice(0, 7)}任务内容...</p>`;
            }
            if (pig_task_title.length > 25) {
                // 容差判断字数多的就是任务标题
                $pig_task_title.innerHTML = `<p title="${pig_task_title}">${pig_task_title.slice(0, 7)}任务标题...</p>`;
            }
        }
        // 如果不存在就返回
        if (!DATA[phone]) {

            // 如果type==2，等待完成列表
            if (type == 2 || true) {
                const Div = document.createElement('div');
                Div.className = 'search';
                Div.style = 'margin-top: 10px;';
                Tools.addRecordBtn(phone, Div,undefined,qq);
                $phone.append(Div);
            }

            return;
        }
        const humans = humanDatas(DATA[phone], '1', pig_type);
        const Datas = humans.records;
        // console.log(DATA[phone], qq);
        const Qqs = humans.qqs.filter(qq_tmp => qq_tmp != qq);
        const wxs = humans.wxs;
        // ${humanData.wxs.length>0?`<p style="margin-top:15px; color:red;">全部wx号：</p>${humanData.wxs.reduce((a,b)=>{
        //     return a + `<p class="j-copyText">${b}</p>`;
        // },'')}`:''}
        {
            // 当是等待完成列表
            if (type == 2) {
                // 如果存在没收录的qq直接收录
                if (!humans.qqs.includes(qq)) {
                    Tools.addQq(phone, qq);
                }
            }
        }
        // console.log(Qqs);
        // console.log(arr);
        // 如果有不一样的qq号
        if (Qqs.length > 0) {
            const qqDiv = document.createElement('div');
            qqDiv.style = 'color:red;';
            qqDiv.innerHTML = `有不同的qq号：${Qqs.map(qq => `<p>${qq}</p>`).join('')}`;
            $qq.append(qqDiv);
        }
        // 如果有微信号
        if (wxs.length > 0) {
            const wxDiv = document.createElement('div');
            wxDiv.style = 'color:red;';
            wxDiv.innerHTML = `有不同的wx号：${wxs.map(wx => `<p>${wx}</p>`).join('')}`;
            $qq.prepend(wxDiv);
        }
        // 标注是否有多个手机号
        if (qq == '1451603208' && type == 2 || true) {
            const phones_arr = humans.diffPhones;
            if (phones_arr.length > 0) {
                // console.log(`插入${JSON.stringify(phones_arr)}`)
                const Div = document.createElement('div');
                Div.style = 'color:blueviolet;';
                let str = phones_arr.reduce((a, b) => {
                    let Datas = Tools.getDatasByPigType(DATA[b], pig_type);
                    if (Datas.length == 0) {
                        return a + `<p>${b}，<br/>已做单：${Datas.length}`;
                    }
                    return a + `<p>${b}，<br/>已做单：${Datas.length}，<br/>最近做单日期：${Datas[0].pig_over_time}，<br/>最近做单渠道号：${QQS[Datas[0].qq_exec_pre] ? QQS[Datas[0].qq_exec_pre].text : Datas[0].qq_exec_pre}</p>`
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
        // 标注真实姓名
        // 在这写微信名字备注
        if(humans.wx_names[real_name]){
            const $div = document.createElement('div');
            $div.innerHTML = `<span style="color:gray;font-size:12px;">（${humans.wx_names[real_name]}）</span>`;
            $realName.append($div);
        }
        if (humans.real_names.length > 1) {
            const arr = humans.real_names.filter(real_name_tmp => real_name_tmp != real_name);
            if (arr.length > 0) {
                // const $realNameTr = $tr.querySelector(`td:nth-child(${qq_index-1})`);
                const $realNameDiv = document.createElement('div');
                $realNameDiv.style = 'color: rgb(16, 0, 255);';
                $realNameDiv.innerHTML = `其他真实姓名：${arr.map(real_name=>{
                    if(humans.wx_names[real_name])return `${real_name}<span style="color:gray;font-size:12px;">（${humans.wx_names[real_name]}）</span>`;
                    return real_name;
                }).join('，')}`;
                $realName.prepend($realNameDiv);
                // $realNameTr.insertAdjacentHTML('beforebegin',$realNameDiv);
            }
        }
        // 标注旺旺号
        if (humans.wwExecs.length > 0 && pig_type == 'TB') {
            // const $wwTr = $tr.querySelector(`td:nth-child(${qq_index-1})`);
            const $wwDiv = document.createElement('div');
            $wwDiv.style = 'color: rgb(16, 0, 255);';
            $wwDiv.innerHTML = `旺旺号：${humans.wws_html}`;
            $realName.append($wwDiv);
        }
        // 标注提醒
        if(humans.remind_texts.length>0){
            const $remindDiv = document.createElement('div');
            $remindDiv.style='color:red;font-size:40px;';
            $remindDiv.innerHTML = `${humans.remind_texts.join('，')}`;
            $phone.prepend($remindDiv);
        }

        // 如果没有记录就返回
        if (Datas.length == 0) {

            // 格式化注册时间到现在多久了

            return;
        }
        // 当是等待完成或已经完成
        if (type == 2 || type == 5) {
            // 如果存在没收录的真实姓名直接收录
            if (!Datas[0].real_name && real_name) {
                Tools.modifyDataToLastRecord(phone, { real_name });
            }
            // 如果没有收录注册时间直接收录
            // if(!Tools.findRegisterTimeByDatas(Datas) && pig_register_time){
            //     console.log(pig_register_time,phone);
            //     Tools.modifyDataToLastRecord(phone,{pig_register_time});
            // }
        }
        // 当时已经完成
        if (type == 5) {
            // 判断完成时间是否是date的bug
            // if(!Tools.isDateValid(humans.typeDatas[pig_type].pig_over_time)){
            //     const $registrTr = $tr.querySelector(`td:nth-child(${date_index})`);
            //     const pig_over_time = trim($registrTr.textContent);
            //     // console.log(humans.pig_over_time, phone,qq,pig_over_time);
            //     if(Tools.isDateValid(pig_over_time)){
            //         Tools.modifyDataToLastRecord(phone,{pig_over_time});
            //     }
            // }
        }

        // 标注已做单数量
        // const $completeTr = $tr.querySelector('td:nth-child(6)');
        const div = document.createElement('div');
        div.style = 'color:red;';
        div.innerHTML = `已做单:${Datas.length}`;
        $phone.append(div);
        // 最近做单日期
        const $registrTr = $tr.querySelector(`td:nth-child(${date_index})`);
        const $lately = document.createElement('div');
        $lately.style = 'color:rgb(16, 0, 255);min-width:120px;';
        let latelyStr = `<p>最近做单日期:${humans.typeDatas[pig_type].record_time}</p>`;
        if (humans.typeDatas[pig_type].record_qq) latelyStr += `<P>最近做单渠道号：${humans.typeDatas[pig_type].record_qq}</P>`;
        if (humans.typeDatas[pig_type].record_come_type) latelyStr += `<p>最后做单渠道:${humans.typeDatas[pig_type].record_come_type}</p>`;
        if (humans.typeDatas[pig_type].record_shop_labels) latelyStr += `<p>做单店铺顺序:${humans.typeDatas[pig_type].record_shop_labels}</p>`;
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
    if(!is_custom)startFormatPendingCon();
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
    if(!is_custom)startFormatAuditingCon();
    // 已完成格式化前100tr
    const startFormatCompleteCon = () => {
        const $Con = document.querySelector('.release_content .content_inner:nth-child(5)');
        const $Trs = $Con.querySelectorAll('.common_table tbody tr:not(:nth-child(1))');

        if (!$Trs) return;
        // console.log(DATA);
        Array.prototype.forEach.call($Trs, ($tr, index) => {
            if (false || index < 20) formatTr($tr, 5, 9, 14, 5);
        })
    }
    if(!is_custom)startFormatCompleteCon();
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
    if(!is_custom)startFormatCancelCon();
    // 得到做单的trs
    function getDataTable(records, btn = [{ text: '标注已评价', className: 'j-addComment', texted: "已评价", val: '1' }, { text: '标注默认评价', className: 'j-addComment', texted: '已默认评价', val: '-1' }], record_length = records.length) {
        // console.log(record_length);
        let trs = '';
        records.forEach(datas => {
            let humanData = humanDatas(datas);
            console.log(humanData);
            // console.log(humanData);
            let btnStr = '';
            if (typeof btn == 'string' && btn) {
                btnStr = btn;
            }
            if (Object.prototype.toString.call(btn) == '[object Object]') {
                btnStr = `<a style="color:red;margin-left:10px;cursor:pointer;" class="${btn.className}" data-qq="${humanData.qqs[0]}" data-phone="${humanData.phone}" data-datas="${JSON.stringify(btn).replaceAll('"', "'")}">${btn.text}</a>`;
            }
            if (Object.prototype.toString.call(btn) == '[object Array]') {
                btnStr += '<div style="margin-top:10px;margin-right:-10px;">';
                btn.forEach(bt => {
                    btnStr += `<a style="color:red;margin-right:10px;cursor:pointer;" class="${bt.className}" data-qq="${humanData.qqs[0]}" data-phone="${humanData.phone}" data-datas="${JSON.stringify(bt).replaceAll('"', "'")}">${bt.text}</a>`;
                })
                btnStr += '</div>';
            }
            trs += `
            <tr>
                <td>
                    <p>${humanData.remind_texts.length>0?`<span style="display:block;color:red;font-size:60px;">${humanData.remind_texts.join('，')}</span>`:''}<span class="j-phone j-copyText">${humanData.phone}</span>${btnStr}</p>
                    ${humanData.diffPhones.length > 0 ? ('<p style="color:red;">有不同的手机号：' + JSON.stringify(humanData.diffPhones) + '</p>') : ''}
                </td>
                <td style="color: blueviolet;">
                    ${humanData.qqs.reduce((a, b) => {
                return a + `<p class="j-copyText">${b}</p>`;
            }, '')}
                ${humanData.wxs.length > 0 ? `<p style="margin-top:15px; color:red;">全部wx号：</p>${humanData.wxs.reduce((a, b) => {
                return a + `<p class="j-copyText">${b}</p>`;
            }, '')}` : ''}
                </td>
                <td style="color:red;">
                    ${humanData.wws_html}
                </td>
                <td>${humanData.real_names.reduceRight((a, real_name) => a + `<p class="j-copyText">${real_name}${humanData.wx_names[real_name] ? `（<span style="color:gray;font-size:12px;">${humanData.wx_names[real_name]}</span>）` : ''}</p>`, '')}</td>
                <td>
                    <table style="width:100%;">
                        <tbody>
                            <tr>
                                <th></th>
                                <th>TB</th>
                                <th>JD</th>
                            </tr>
                            <tr>
                                <td>最近做单渠道</td>
                                <td style="color:gray;">${Tools.findNameByComeTypeValue(humanData.typeDatas.TB.record_come_type)}</td>
                                <td style="color:gray;">${Tools.findNameByComeTypeValue(humanData.typeDatas.JD.record_come_type)}</td>
                            </tr>
                            <tr>
                                <td>最近做单渠道号</td>
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
                                <td style="min-width:86px;">做单店铺顺序</td>
                                <td style="max-width:170px;padding:10px;">${humanData.typeDatas.TB.record_shop_labels || ''}</td>
                                <td>${humanData.typeDatas.JD.record_shop_labels || ''}</td>
                            </tr>
                            <tr>
                                <td>最近评论状态</td>
                                <td>${humanData.typeDatas.TB.record_comment == '1' ? '<span style="color:gray;">已经评价</span>' : humanData.typeDatas.TB.record_comment == '-1' ? '<span style="color:rgb(16, 0, 255);">默认评价</span>' : humanData.typeDatas.TB.record_comment || ''}</td>
                                <td>${humanData.typeDatas.JD.record_comment == '1' ? '<span style="color:gray;">已经评价</span>' : humanData.typeDatas.JD.record_comment == '-1' ? '<span style="color:rgb(16, 0, 255);">默认评价</span>' : humanData.typeDatas.JD.record_comment || ''}</td>
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
                <td>${humanData.register_time || ''}</td>
            </tr>
            `
        })
        let table = `
        <div style="margin-bottom: 10px; color:gray;text-align:center;">....搜索到<span style="color:red;">${record_length}</span>个结果${record_length > records.length ? `，还剩下<span style="color:red;">${record_length - records.length}</span>个待显示` : ''}.....</div>
        <table class="common_table" style="margin-top:10px; margin-bottom:10px;">
            <tbody>
                <tr>
                    <th>手机号</th>
                    <th>qq号和wx号</th>
                    <th>旺旺号</th>
                    <th>真实姓名（微信名字）</th>
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
                        <div style="margin-bottom: 10px;"><input class="search_input j-gnote" placeholder="网页备注/真实姓名" /><button class="search_btn add-gnote">添加网页备注</button><button class="search_btn j-real-name-add-btn" style="background:rebeccapurple;margin-left:10px;">修改真实姓名</button></div>
                        <div><select class="search_input qq_exec_pre" style="width:auto;">${option_strs}</select><button class="search_btn add-record">添加做单记录</button><button class="search_btn j-del-data" style="background:rebeccapurple;margin-left:5px;">删除做单记录</button></div>    
                    </div>
                </div>
                <div class="search m-search">
                        <input class="search_input j-contact-input" type="text" data-key="wx" placeholder="wx号" />
                        <button class="search_btn j-contact-add" data-key="wx" style="margin-left:10px">添加wx</button>
                        <button class="search_btn j-contact-del" data-key="wx" style="background:red;margin-left:10px;">删除wx</button>
                        <button class="search_btn j-add-wxName-by-wx" style="background:rebeccapurple; margin-left:10px;">wx添加wx姓名</button>
                        <input class="search_input j-wxName" type="text" placeholder="wx名字(真实姓名)|wx姓名" style="margin-left:10px;width:165px;" />
                        <button class="search_btn j-wxName-add" style="margin-left:10px">添加wx姓名</button>
                        <button class="search_btn j-wxName-del" style="background:red;margin-left:10px;">删除wx姓名</button>
                        <button class="search_btn j-realName-search" style="background:rebeccapurple; margin-left:10px;">真实姓名搜索</button>
                </div>
                <div class="search m-search j-order-search">
                    查询订单是否被抓：<input class="search_input order-id" placeholder="查询订单号" /> <button class="search_btn order-search
                    " style="margin: 0 10px;">查询</button><div class="orderCon" style="color:gray;"></div>
                    <input class="search_input j-ww-exec" placeholder="旺旺号" /> <button class="search_btn ww-add
                    " style="margin: 0 10px;">添加旺旺号</button><button class="search_btn ww-del" style="background:red;">删除旺旺号</button>
                    <button class="search_btn ww-add-back-second" style="margin-left:10px;">添加倒数旺旺号</button>
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
                        .gray{
                            color:#d9d6d6;
                        }
                    </style>
                    <!-- <div style="color:darkmagenta; ">${JSON.stringify(qqs_obj)}</div> -->
                    <div class="m-findData search">
                    <!-- <button class="search_btn j-findPhoneBtn" style="">查询phone做单数据</button>
                        <button class="search_btn j-findQqBtn" style="background:rebeccapurple;">查询qq做单数据</button>-->
                        <button class="search_btn j-almightySearch" style="">qq|phone|ww|wx全能搜索</button>
                        <!-- <button class="search_btn j-searchNote" style="background:rebeccapurple;">模糊搜索用户备注</button>-->
                        <!--<button class="search_btn j-findQqs" style="">查询不同的qq</button>-->
                        <button class="search_btn download" style="background:rebeccapurple;">下载数据</button>
                        <button class="search_btn j-gatherQqs" style="">筛选qq1235</button>
                        <button class="search_btn j-gatherRegisterQqs" style="background:rebeccapurple;">无损筛选qq1235</button>
                        <button class="search_btn j-gatherShop" style="">查询店铺做单数据46</button>
                        <button class="search_btn j-modifyLastRecord" style="background:rebeccapurple;">修改最后一个记录67</button>
                        <!-- <div class="j-addOtherRecord"></div> -->
                        <button class="search_btn j-addRecordQqWw">创建新纪录并添加qq和旺旺</button>
                    </div>
                    <div class="m-findData search" style="margin-top:0px;">
                        <span class="gray">1：</span><select class="search_input j-screen"><option value="1">筛选被抓</option><option value="0" selected>不筛选被抓</option></select>
                        <span class="gray">2：</span><select class="search_input j-screen-time"><option value="1" selected>筛选正序</option><option value="-1">筛选逆序</option></select>
                        <span class="gray">3：</span><input class="search_input j-search-time" placeholder="搜索时间" value="2023-04-01" type="date" />
                        <span class="gray">4：</span><select class="search_input j-comment-sel"><option value="" selected>未知评价</option><option value="1">已评价</option><option value="-1">默认评价</option></select>
                        <span class="gray">5：</span><select class="search_input j-pig-type"><option value="TB">TB</option><option value="JD">JD</option></select>
                        <span class="gray">6：</span><select class="search_input j-shop-id">${LABELS.getShopOptionsHtml()}</select>
                        <span class="gray">7：</span><select class="search_input j-come-type">${COMETYPE.map(type => `<option value="${type.value}">${type.name}</option>`)}</select>
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
                                    <th>最近做单渠道号</th>
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
        const $ww = qqAdd.querySelector('.j-ww-exec');
        const $pigType = qqAdd.querySelector('.j-pig-type');
        const $comeType = qqAdd.querySelector('.j-come-type');
        const $qqExecPre = qqAdd.querySelector('.qq_exec_pre');
        const $searchTime = qqAdd.querySelector('.j-search-time');
        const $gNote = qqAdd.querySelector('.j-gnote');
        const $wx = qqAdd.querySelector('.j-contact-input[data-key="wx"]');
        const $wxName = qqAdd.querySelector('.j-wxName');
        // 当come-type变动的话
        $comeType.addEventListener('change', e => {
            const come_type = $comeType.value;
            let fix;
            COMETYPE.forEach(type => {
                if (type.value == come_type) fix = type.fix;
            })
            const qq = $byQQ.value;
            const phone = $phone.value;
            if (fix && qq && !phone) {
                $phone.value = `${fix}-${qq}`;
            }
        }, false)
        // qq改变后填充phone和旺旺和wx和真实姓名
        $byQQ.addEventListener('input', Tools.throttle(e => {
            const qq = $byQQ.value;
            const phones = Tools.almightySearch([qq]);
            const come_type_default = Tools.findDefaultValueBySelect($comeType);
            const qq_exec_pre_default = Tools.findDefaultValueBySelect($qqExecPre);
            if (phones.length == 0) {
                $phone.value = '';
                $ww.value = '';
                $wx.value = '';
                $gNote.value = '';
                $comeType.value = come_type_default;
                $qqExecPre.value = qq_exec_pre_default;
                return;
            }
            if (phones.length > 1) {
                $ww.value = '';
                $wx.value = '';
                $gNote.value = '';
                $comeType.value = come_type_default;
                $qqExecPre.value = qq_exec_pre_default;
                return $phone.value = '有多个手机号';
            }
            const phone = phones[0];
            $phone.value = phone;
            const wws = Tools.findWwsByPhones([phone]);
            $ww.value = wws.join('，');
            $wx.value = Tools.findWxsByDatas(DATA[phone],false).join(',');
            $gNote.value = Tools.findRealNamesByDatas(DATA[phone]).join(',');
            // 得到最后一个记录的come-type,qq_exec_pre
            const { come_type, qq_exec_pre } = Tools.findLastKeyValuesByDatas(DATA[phone], ['come_type', 'qq_exec_pre']);
            if (come_type) $comeType.value = come_type;
            if (qq_exec_pre) $qqExecPre.value = qq_exec_pre;
            // const datas = findDatasByQq(qq);
            // // console.log(datas);
            // if (datas.length > 0) {
            //     if (datas.length === 1) {
            //         const phone = datas[0][0].pig_phone;
            //         $phone.value = phone;
            //         const wwExecs = findWWExecs(DATA[phone]);
            //         $ww.value = wwExecs.join('，');
            //     } else {
            //         $phone.value = '有多个手机号';
            //     }
            // } else {
            //     $phone.value = '';
            // }

        },1000))
        // 旺旺号变化之后的反应
        $ww.addEventListener('input',Tools.throttle( e => {
            const wwExec = e.target.value;
            if (wwExec) {
                const phoneArr = Tools.almightySearch([wwExec]);
                // console.log(phoneArr);
                if (phoneArr.length > 0 && !$phone.value) {
                    $phone.value = phoneArr.join(',');
                    // setCon(['']);
                } else {
                    // setCon(['没有找到phone']);
                }
            }
        },1000), false)
        // wx变化之后的反应
        // $wx.addEventListener('input', e => {
        //     const wx = e.target.value;
        //     if (wx) {
        //         const phoneArr = Tools.almightySearch([wx]);
        //         // console.log(phoneArr);
        //         if (phoneArr.length > 0) {
        //             $phone.value = phoneArr.join(',');
        //             // setCon(['']);
        //         } else {
        //             // setCon(['没有找到phone']);
        //         }
        //     }
        // }, false)
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
            const wwId = $ww.value;
            const phone = $phone.value;
            const result = Tools.addWW(phone, wwId);
            if (result) alert('添加旺旺成功');
        }, false)
        // 删除旺旺号
        qqAdd.querySelector('.j-order-search .ww-del').addEventListener('click', e => {
            const wwId = $ww.value;
            const phone = $phone.value;
            // if (confirm('确定删除吗？')) {
            //     if (!DATA[phone]) {
            //         alert('找不到对应的记录~')
            //         return;
            //         // DATA[phone] = [];
            //     }
            //     // console.log(wwId);
            //     const datas = DATA[phone].filter(data => data.pig_id || data.ww_exec != wwId);
            //     // console.log(datas);
            //     DATA[phone] = datas;
            //     storageData();
            //     alert('旺旺号删除成功');
            // }
            const result = Tools.delWW(phone, wwId);
            if (result) alert(`旺旺号${wwId}删除成功`);
        }, false)
        // 添加倒数旺旺号
        qqAdd.querySelector('.j-order-search .ww-add-back-second').addEventListener('click', e => {
            const wwId = $ww.value;
            const phone = $phone.value;
            const result = Tools.addWWBackSecond(phone, wwId);
            if (result) alert('添加旺旺成功');
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
            const result = Tools.addQq(phone, qq);
            if (result) alert('qq添加成功');
        }, false)
        // 删除qq
        qqAdd.querySelector('.del').addEventListener('click', e => {
            const qq = qqAdd.querySelector('.qq').value;
            const phone = $phone.value;
            // if (confirm('确定删除吗？')) {
            //     if (!DATA[phone]) {
            //         alert('找不到对应的记录~')
            //         return;
            //         // DATA[phone] = [];
            //     }
            //     const datas = DATA[phone].filter(data => data.pig_id || data.pig_qq != qq);
            //     // console.log(datas);
            //     DATA[phone] = datas;
            //     storageData();
            //     alert('qq删除成功');
            // }
            const result = Tools.delQq(phone, qq);
            if (result) alert(`${qq}删除成功`);
        }, false)
        // 添加备注
        qqAdd.querySelector('.add-note').addEventListener('click', (e) => {
            const note = qqAdd.querySelector('.note').value;
            const phone = $phone.value;
            const pig_type = $pigType.value;
            // if (Tools.alertFuc({ phone, note, pig_type })) return;
            // // console.log(qq,phone);
            // if (!DATA[phone]) {
            //     alert('找不到对应的记录~')
            //     return;
            //     // DATA[phone] = [];
            // }
            // DATA[phone].push({
            //     pig_phone: phone,
            //     pig_note: note,
            //     pig_type: pig_type,
            //     create_time: new Date().toLocaleString(),
            // })
            // storageData();
            const result = Tools.addNote(phone, note, pig_type);
            if (result) alert('备注添加成功');
        }, false)
        // 删除备注
        qqAdd.querySelector('.del-note').addEventListener('click', e => {
            const note = qqAdd.querySelector('.note').value;
            const phone = $phone.value;
            const pig_type = $pigType.value;
            // if (confirm('确定删除吗？')) {
            //     if (!DATA[phone]) {
            //         alert('找不到对应的记录~')
            //         return;
            //         // DATA[phone] = [];
            //     }
            //     const datas = DATA[phone].filter(data => data.pig_note != note);
            //     // console.log(datas);
            //     DATA[phone] = datas;
            //     storageData();
            //     alert('备注删除成功');
            // }
            const result = Tools.delNote(phone, note, pig_type);
            if (result) alert(`${note}备注删除成功`);
        }, false)
        // 添加网页备注
        qqAdd.querySelector('.add-gnote').addEventListener('click', (e) => {
            const gnote = $gNote.value;
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
            const qq_exec_pre = $qqExecPre.value;
            const shop_label = qqAdd.querySelector('.j-shop-id').value;
            const come_type = $comeType.value;
            const wx = $wx.value;
            const record = { pig_phone: phone, pig_over_time: new Date().toLocaleString(), qq_exec_pre: qq_exec_pre, shop_label, pig_type, come_type };
            // if(wx)record.wx = wx;
            // if(qq)record.pig_qq = qq;
            // if(!wx && !qq)return alert('wx|qq最少填写一个联系方式');
            // if(['a847457846'].includes(qq_exec_pre) && !wx)return alert('wx必须填写')
            if (!['a847457846'].includes(qq_exec_pre)) {
                if (qq) record.pig_qq = qq;
                if (Tools.alertFuc({ qq })) return;
            } else {
                if (wx) record.wx = wx;
                if (Tools.alertFuc({ wx })) return;
            }
            if (Tools.alertFuc({ shop_label, phone, qq_exec_pre, pig_type, come_type })) return;
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
        // 删除整个记录
        qqAdd.querySelector('.j-del-data').addEventListener('click',e=>{
            const pig_phone = $phone.value;
            const result = Tools.deleteData(pig_phone);
            if(result)alert('删除成功');
        },false)
        // 添加联系方式
        addEventListener(qqAdd, 'click', (e) => {
            const pig_phone = $phone.value;
            // const $addBtn = e.target;
            // const key = $addBtn.getAttribute('data-key');
            const $input = qqAdd.querySelector(`.j-contact-input[data-key="wx"]`);
            const value = $input.value;
            if (Tools.addWx(pig_phone, value)) {
                alert('添加成功');
            }
        }, '.j-contact-add');
        addEventListener(qqAdd, 'click', e => {
            const pig_phone = $phone.value;
            // const $addBtn = e.target;
            // const key = $addBtn.getAttribute('data-key');
            const $input = qqAdd.querySelector(`.j-contact-input[data-key="wx"]`);
            const value = $input.value;
            if (Tools.delWx(pig_phone, value)) {
                alert('删除成功');
            }
        }, '.j-contact-del')
        addEventListener(qqAdd, 'input', e => {
            const $input = e.target;
            const value = $input.value;
            if (value) {
                const phoneArr = Tools.almightySearch([value]);
                // console.log(phoneArr);
                if (phoneArr.length > 0 && !$phone.value) {
                    $phone.value = phoneArr.join(',');
                    // setCon(['']);
                } else {
                    // setCon(['没有找到phone']);
                }
            }
        }, '.j-contact-input')
        // 添加wxNamebyWx
        qqAdd.querySelector('.j-add-wxName-by-wx').addEventListener('click',e=>{
            const pig_phone = $phone.value;
            const wx_name = $wxName.value;
            const wx = $wx.value;
            const result = Tools.addWxNameByWx(pig_phone,wx,wx_name);
            if(result)alert('添加wx名字成功');
        })
        // 设置显示内容 
        const $btns = qqAdd.querySelector('.btns');
        const $con = $btns.querySelector('.u-con');
        const getCon = (arr, len) => {
            let str = '';
            const datas = Tools.getShortDatas(arr, len);
            datas.forEach(data => {
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
            const phone = $btn.getAttribute('data-phone');
            const datas = JSON.parse($btn.getAttribute('data-datas').replaceAll("'", '"'));
            $btn.textContent = '已去除';
            $btn.style.color = 'gray';
            copyToClipboard(qq);
            switch (datas.type) {
                case 'order_reminder':
                    RDATA.addOrderReminder(phone);
                    break;
                case 'comment_reminder':
                    RDATA.addCommentReminder(phone);
                    break;
                default:
                    RDATA.addOrderReminder(phone);
                    break;
            }
        }, '.j-remindPhone')
        //不再提醒
        addEventListener($con, 'click', e => {
            const $btn = e.target;
            const phone = $btn.getAttribute('data-phone');
            Tools.noRemind(phone);
            $btn.textContent = '已不再提醒';
            $btn.style.color = 'gray';
        }, '.j-no-remind')
        // 点击copy
        addEventListener($con, 'click', e => {
            const $text = e.target;
            const text = $text.textContent;
            $text.style.cursor = 'pointer';
            $text.title = '点击复制';
            copyToClipboard(text);
            const copyed = $text.getAttribute('data-copyed');
            if (copyed !== '1') {
                const $after = document.createElement('span');
                $after.style = 'color:gray;margin-left:3px;';
                $after.textContent = '已复制';
                $text.after($after);
            }
            $text.setAttribute('data-copyed', '1');
        }, '.j-copyText')
        function GatherQqs(cb = () => true, pig_type = 'TB') {
            let endTime = new Date(new Date().getTime() - 20 * 24 * 60 * 60 * 1000);
            // let startTime = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
            let startTime = new Date($searchTime.value);
            const is_screen = qqAdd.querySelector('.j-screen').value;
            const screen_time = parseInt(qqAdd.querySelector('.j-screen-time').value, 10);
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
                if (data && new Date(data.pig_over_time) > startTime && new Date(data.pig_over_time) < endTime) {
                    DateRecords.push(data)
                }
            }
            // 筛选符合的记录
            DateRecords = DateRecords.filter(record => {
                let datas = DATA[record.pig_phone];
                const humanData = humanDatas(datas);
                const notes = humanData.notes.join('');
                const diffPhones = humanData.diffPhones;
                if (
                    (notes.indexOf('满月') == -1 || true)
                    && notes.indexOf('删订单') == -1
                    && (diffPhones.length == 0 || true)
                    && !RDATA.isExist(record.pig_phone, 'order_reminder')
                    && cb(humanData)
                ) {
                    if ((is_screen == '1' && (notes.indexOf('被抓') == -1 || notes.indexOf('已换号') != -1)) || is_screen == '0') {
                        return true;
                    }
                }
            })
            // 排序
            DateRecords.sort((a, b) => {
                if (new Date(a.pig_over_time) > new Date(b.pig_over_time)) {
                    return screen_time;
                } else {
                    return -screen_time;
                }
            })
            const table = getDataTable(DateRecords.slice(0, 5).map(data => DATA[data.pig_phone]), [{ text: 'copy去除', className: 'j-remindPhone', type: 'order_reminder' }, { text: '不再提醒', className: 'j-no-remind' }], DateRecords.length);
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
                // return new Date(humanData.record_time) - 30 * 24 * 60 * 60 * 10000 > new Date(humanData.register_time);
                return true;
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
                if (trim(datas[0].shop_label) == trim(shop_label) && !datas[0].is_remind) {
                    if ((comment_sel === '' && !datas[0].is_comment) || (comment_sel && comment_sel == datas[0].is_comment)) {
                        if (!RDATA.isExist(phone, 'comment_reminder')) arr.push(datas[0]);
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
            let dyStr = '';
            if (arr.length > 5) {
                dyStr += `<div style="margin-bottom: 10px; color:gray;text-align: center">....还剩下<span style="color:red;">${arr.length - 5}</span>个.....</div>`
            }
            // console.log(arr);
            const phoneDatas = [];
            const forLen = arr.length < 5 ? arr.length : 5;
            for (let i = 0; i < forLen; i++) {
                phoneDatas.push(DATA[arr[i].pig_phone]);
            }
            // console.log(phoneDatas);
            const table = getDataTable(phoneDatas, comment_sel === '' ? [{ text: '标注已评价', className: 'j-addComment', texted: "已评价", val: '1' }, { text: '标注默认评价', className: 'j-addComment', texted: '已默认评价', val: '-1' }, { text: '<br/>copy去除comment', className: 'j-remindPhone', type: 'comment_reminder' }, { text: '不再提醒', className: 'j-no-remind' }] : comment_sel == '-1' ? { text: '标注已评价', className: 'j-addComment', texted: "已评价", val: '1' } : '');
            setCon([dyStr + table]);
        }, false)
        // 标注已评跟默认评价按钮
        addEventListener($con, 'click', (e) => {
            const $btn = e.target;
            const $parent = $btn.parentNode;
            // const qq = $btn.getAttribute('data-qq');
            // console.log($btn.getAttribute('data-datas'));
            const datas = JSON.parse($btn.getAttribute('data-datas').replaceAll("'", '"'));
            const phone = $btn.getAttribute('data-phone');
            $btn.textContent = datas.texted;
            $btn.style.color = 'gray';
            // console.log(qq,phone);
            Tools.lastAddCommentByPhone(phone, datas.val);
        }, '.j-addComment')
        {
            // 添加非手机记录
            // const $addOtherRecordBtn = qqAdd.querySelector('.j-addOtherRecord');
            // Tools.addRecordBtn(() => {
            //     return $phone.value;
            // }, $addOtherRecordBtn, '添加非手机记录');
        }
        // 模糊搜索用户备注
        // addEventListener(qqAdd, 'click', e => {
        //     const note = qqAdd.querySelector('.note').value;
        //     if (Tools.alertFuc({ note })) return false;
        //     const arr = [];
        //     const phones = Object.keys(DATA);
        //     for (let phone of phones) {
        //         const datas = DATA[phone];
        //         for (let data of datas) {
        //             if (data.pig_note && data.pig_note.indexOf(note) !== -1) {
        //                 arr.push(datas);
        //                 break;
        //             }
        //         }
        //     }
        //     const table = getDataTable(arr);
        //     setCon([`<div style="margin-bottom: 10px; color:gray;text-align:center;">....搜索到<span style="color:red;">${arr.length}</span>个结果.....</div>`, table]);
        // }, '.j-searchNote')
        // 修改最后一个做单记录
        addEventListener(qqAdd, 'click', e => {
            const phone = $phone.value;
            const shop_label = qqAdd.querySelector('.j-shop-id').value;
            const qq_exec_pre = $qqExecPre.value;
            const come_type = $comeType.value;
            if (Tools.alertFuc({ phone, shop_label, qq_exec_pre, come_type })) return;
            Tools.modifyDataToLastRecord(phone, { shop_label, qq_exec_pre, come_type });
            alert('修改成功');
        }, '.j-modifyLastRecord')
        // 添加真实姓名
        addEventListener(qqAdd, 'click', e => {
            const real_name = $gNote.value;
            const phone = $phone.value;
            // if (Tools.alertFuc({ real_name, phone })) return;
            // Tools.modifyDataToLastRecord(phone, { real_name });
            const result = Tools.addRealName(phone, real_name);
            if (result) alert('修改真实姓名成功');
        }, '.j-real-name-add-btn')
        // 添加wx名字
        qqAdd.querySelector('.j-wxName-add').addEventListener('click', () => {
            const pig_phone = $phone.value;
            const wx_name = $wxName.value;
            const real_name = $gNote.value;
            const result = Tools.addWxName(pig_phone, wx_name, real_name);
            if (result) alert(`添加真实姓名（${real_name}）对应微信姓名（${wx_name}）成功`);
        })
        qqAdd.querySelector('.j-wxName-del').addEventListener('click', () => {
            const pig_phone = $phone.value;
            const wx_name = $wxName.value;
            const result = Tools.delRealNameWxName(pig_phone, wx_name);
            if (result) alert(`删除微信姓名（${wx_name}）成功`);
        })
        // 创建新纪录并添加qq和旺旺
        addEventListener(qqAdd, 'click', e => {
            const phone = $phone.value;
            const qq = $byQQ.value;
            const ww = $ww.value;
            const result = Tools.addRecordQqWw(phone, qq, ww);
            if (result) alert('添加新纪录并添加qq和旺旺成功');
        }, '.j-addRecordQqWw')
        // 全能搜索
        addEventListener(qqAdd, 'click', e => {
            const qq = $byQQ.value;
            const phone = $phone.value;
            const ww = $ww.value;
            const wx = $wx.value;
            const keywords = [qq, phone, ww, wx].filter(keyword => keyword);
            if (keywords.length == 0) return alert('请填写关键字qq||phone|ww|wx!');
            // console.log(keywords);
            // console.log(Tools.findPhonesByKeyword(qq));
            // return;
            const arr = Tools.almightySearch(keywords).map(phone => DATA[phone]);
            if (arr.length == 0){
                setCon([`没找到做单记录<span style="margin:15px;display:inline-block;width:auto;height:auto;" class="j-add-record-btn search"></span>`]);
                Tools.addRecordBtn(phone,qqAdd.querySelector('.j-add-record-btn'),undefined,qq);
                return;
            }
            // 判断是否有一个qq多个手机的情况存在
            // console.log(arr);
            if (arr.length === 1) {
                // 单手机
                let datas = arr[0];
                let table = getDataTable([datas])
                setCon([table, getCon(datas, 3)]);
                // setCon(arr[0]);
            } else {
                // 多手机号
                let str = getCon(arr);
                let table = getDataTable(arr);
                setCon([table + str]);
            }
            // alert(JSON.stringify(arr));
        }, '.j-almightySearch')
        // 真实姓名搜索
        addEventListener(qqAdd, 'click', e => {
            const value = $gNote.value;
            const arr = Tools.searchKeyValue('real_name', value).map(phone => DATA[phone]);
            if (arr.length == 0) return setCon(['没找到做单记录']);
            // 判断是否有一个qq多个手机的情况存在
            // console.log(arr);
            if (arr.length === 1) {
                // 单手机
                let datas = arr[0];
                let table = getDataTable([datas])
                setCon([table, getCon(datas, 3)]);
                // setCon(arr[0]);
            } else {
                // 多手机号
                let str = getCon(arr);
                let table = getDataTable(arr);
                setCon([table + str]);
            }
        }, '.j-realName-search')
    }
    AddQQDiv();

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
    // // 评论相关的脚本
    // const AddComment = ()=>{
    //     const Div = document.createElement('div');
    //     Div.innerHTML = `
    //         <style>
    //             .m-pig-comment>.comment-header{
    //                 margin-bottom: 10px;
    //             }
    //             .m-pig-comment>.comment-header>span{
    //                 display:inline-block;
    //                 padding: 5px 10px;
    //                 border-right: 1px solid gray;
    //             }
    //         </style>
    //         <div class="m-pig-comment j-pig-comment">
    //             <div class="comment-header">
    //                 <span>肛瘘-1</span><span>肛瘘-2</span><span>痔疮-1</span><span>痔疮-2</span>
    //             </div>
    //         </div>
    //     `;
    //     const $pigComment = Div.querySelector('.j-pig-comment');
    //     document.querySelector('.release').prepend(Div);
    // }
    // AddComment();
    const cshLocal = (obj) => {
        Object.keys(obj).forEach(key => {
            localStorage.setItem(key, JSON.stringify(obj[key]));
        })
    }

    window.PIG = {
        Download,
        Tools, cshLocal
    }
})();
