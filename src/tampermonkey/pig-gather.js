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
class CustomStorage {
    constructor() {
        this.storage = localStorage;
    }

    setItem(key, value) {
        const compressedValue = LZString.compressToBase64(JSON.stringify(value));
        this.storage.setItem(key, compressedValue);
    }

    getItem(key) {
        const storedValue = this.storage.getItem(key);
        if (storedValue) {
            return JSON.parse(LZString.decompressFromBase64(storedValue));
        }
        return null;
    }
}
const customStorage = new CustomStorage();


(function () {
    'use strict';
    // Your code here...
    // {
    //     phone账号或者唐人账号：[
    //         {pig_phone,ww_exec,is_del?:'1',gender?:男1or女0,note?:备注} 添加做单旺旺号
    //         {pig_phone唐人账号,pig_qq?,wx?,qq_exec_pre,pig_over_time,shop_label?:LABELS店铺类型,pig_type?:TB|JD:小猪做单类型,is_comment?:0没评|1已评|-1默认评,come_type?:COMETYPE来子哪里的单子,is_remind?:'-1'是否提醒,real_name:？真实姓名} 添加做单记录            
    //         {pig_phone,pig_note,create_time?,pig_type?} 添加备注
    //         {pig_phone,pig_qq} 添加不同的qq
    //         {pig_phone,mobile} 添加不同的手机号
    //         {pig_phone,wx,wx_name?} 添加不同的wx
    //         {pig_phone,real_name,wx_name} 收款信息
    //         {pig_phone,tang_register_time} 唐人的注册时间
    //         {pig_phone,tang_id} 唐人的id
    //         {pig_phone,commission} 佣金多少
    //         {pig_phone,teamer} 属于哪个团队
    //         {pig_phone,wait} 等待处理
    //         {pig_phone,nickname} 昵称
    //         {pig_phone,jd,jd_nickname?} 添加京东号，京东号昵称
    //         { task_id, pig_phone, pig_qq, pig_register_time, pig_over_time, qq_exec_pre?, shop_label?,pig_type?:TB|JD ,is_comment?:0|1，is_remind?:'-1'是否提醒, real_name:？真实姓名,remind_add_wx？:1提醒添加微信} 正常小猪单
    //     ]
    // }
    // 获取已完成小猪数据
    const DATA = customStorage.getItem('completeOrders') || {};

    const COMETYPE = [
        { name: '唐人', fix: '', value: 'tang' },
        { name: 'A97-欢乐购秒杀1群-有新人', fix: 'QQ', value: '626195966' },
        { name: 'A97-欢乐购秒杀2群', fix: 'QQ', value: '244917614' },
        { name: 'A97-欢乐购秒杀11群', fix: 'QQ', value: '1074927054' },
        { name: 'A97-欢乐购秒杀5群-新群', fix: 'QQ', value: '87201879' },
        { name: 'A97-欢乐购火箭🚀1群', fix: 'QQ', value: '272916421' },
        { name: 'A97-欢乐购火箭🚀3群', fix: 'QQ', value: '325019211' },
        { name: 'A97-欢乐购火箭🚀④群-新人', fix: 'QQ', value: '532849108' },
        { name: 'A97-欢乐购秒杀🚀5群-新群', fix: 'QQ', value: '940096908' },
        { name: 'pig', fix: '', value: 'pig', commission: '7' },
        { name: '凤凰', fix: '', value: 'fh' },
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
        },
        'tang': {
            text: '唐人app',
            color: 'brown'
        }
    }
    const TEAMERS = {
        'a97': {
            text: 'A97团队'
        },
        'xt': {
            text: '肖婷总代'
        },
        'yy': {
            text: '瑶摇总代'
        },
        'an': {
            text: '阿媛总监-团队散了'
        },
        'mc': {
            text: '沐晨总监'
        },
        'mm': {
            text: '沐沐总代'
        },
        'jj': {
            text: 'JiaJia总代'
        },
        'dd': {
            text: '滴滴总监'
        },
        'rr': {
            text: '茹茹总监'
        },
        'yy2': {
            text: '莹莹总监'
        },
        'by': {
            text: '冰燕总监'
        },
        'cbb': {
            text: '晨宝贝-A97'
        },
        'kg': {
            text: '琨哥总监'
        },
        'hh': {
            text: '会慧总监'
        },
        'jj2': {
            text: '佳佳总监'
        },
        'ft': {
            text: '斐婷总监'
        },
        'bb': {
            text: '彬彬'
        },
        'nn': {
            text: '闹闹总监'
        },
        'xhm': {
            text: '小红帽'
        },
        'yoyo': {
            text: 'YOYO总代'
        }
    };
    const ORDERTYPES = ['TB', 'JD'];
    const storageData = async () => {
        customStorage.setItem('completeOrders', DATA);
    }
    // 店铺数据
    const LABELS = {
        TB_datas: [
            // {
            //     label: '万阁',
            //     options: ['痔疮7', '肛裂6', '肛瘘9'],
            // },
            // {
            //     label: '广浴隆',
            //     options: ['肛瘘10', '肛裂6', '痔疮7'],
            // },
            // {
            //     label: '艾跃',
            //     options: ['痔疮6', '乳腺1', '疱疹2', '白斑2'],
            // },
            {
                label: '处韵',
                options: ['肛裂1','肛瘘1','痔疮1'],
            }
        ],
        JD_datas: [
            {
                label: 'jd处韵',
                options: ['肛瘘1', '肛裂1', '痔疮1'],
            }
        ],
        getShopOptionsHtml: (pig_type = 'TB') => {
            // const datas = (pig_type == 'TB' ? LABELS.TB_datas : LABELS.JD_datas);
            const datas = LABELS[`${pig_type}_datas`];
            return `<option value="">没有选择店铺</option>` + datas.map(shop => {
                return `<optgroup label='${shop.label}'>${shop.options.map(option => `<option value='${shop.label}-${option}'>${shop.label}-${option}</option>`).reduce((a, b) => a + b, '')}</optgroup>`;
            }).reduce((a, b) => a + b, '');
        }
    }
    // 店铺缓存数据
    // const SHOPDATAS = {
    //     // {task_id:shop_label}
    //     datas: {},
    //     getDatas: () => {
    //         let datas = localStorage.getItem('shopDatas') ? JSON.parse(localStorage.getItem('shopDatas')) : {};
    //         SHOPDATAS.datas = datas;
    //     },
    //     storageData: () => {
    //         localStorage.setItem('shopDatas', JSON.stringify(SHOPDATAS.datas));
    //     },
    //     addData: (task_id, shop_label) => {
    //         if (Tools.alertFuc({ task_id })) return false;
    //         SHOPDATAS.datas[task_id] = shop_label;
    //         if (!shop_label) SHOPDATAS.delData(task_id);
    //         SHOPDATAS.storageData();
    //         return true;
    //     },
    //     delData: (task_id) => {
    //         delete SHOPDATAS.datas[task_id];
    //         SHOPDATAS.storageData();
    //     },
    //     appendShopLable: (pig_phone, task_id, shop_label) => {
    //         if (Tools.alertFuc({ pig_phone, task_id })) return false;
    //         if (!DATA[pig_phone]) return alert('不存在做单数据');
    //         const datas = DATA[pig_phone];
    //         for (let i = 0; i < datas.length; i++) {
    //             if (datas[i].task_id == task_id) {
    //                 DATA[pig_phone][i].shop_label = shop_label;
    //                 if (!shop_label) delete DATA[pig_phone][i].shop_label;
    //                 SHOPDATAS.delData(task_id);
    //                 storageData();
    //             }
    //         }
    //     },
    //     getData: (task_id) => {
    //         return SHOPDATAS.datas[task_id];
    //     }
    // }
    // SHOPDATAS.getDatas();
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
        dispatchEvent: ($ele, type) => {
            const event = new Event(type, {
                bubbles: true,
                cancelable: true,
            });
            $ele.dispatchEvent(event);
        },
        getTime: () => {
            return new Date().toLocaleString();
        },
        // 判断是否是一个日期字符串
        isDateValid: (...val) => {
            return !Number.isNaN(new Date(...val).valueOf());
        },
        trim: (str) => {
            if (!str) return str;
            // str = str.replace(/\ +/g, '');
            // str = str.replace(/[\r\n\t]/g, '');
            str = str.trim();
            return str;
        },
        highLightStr: (string, str) => {
            if (!str) return string;
            // console.log(str);
            const reg = new RegExp(str, 'g');
            return string.replaceAll(reg, function (match) {
                // console.log(match);
                return `<span style="background:yellow;">${match}</span>`;
            })
        },
        // 删除DATA的整个记录data
        deleteData: (pig_phone) => {
            if (Tools.alertFuc({ pig_phone })) return false;
            if (confirm(`确定删除(${pig_phone})吗？`)) {
                delete DATA[pig_phone];
                storageData();
                return true;
            } else {
                return false;
            }
        },
        // 判断是否可删的key
        isDelKey: (data, key) => {
            let result = true;
            if (!data || !key) return false;
            const keys = Object.keys(data);
            // 必须是is里面的字段
            const is = ['pig_phone', key, 'is_del', 'create_time', 'gender'];
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
        addKeyValue: (pig_phone, key, value, middleFuc = () => true, otherKeysFuc = () => { return {} }, spliceIndex = DATA[pig_phone]?.length, isRepeat = false) => {
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
                const datas = DATA[pig_phone].filter(data => data.pig_over_time || data[key] != value || otherKeysFuc(data));
                // console.log(datas);
                DATA[pig_phone] = datas;
                storageData();
                // alert(`${key}=${value}删除成功`);
                return true;
            }
        },
        // 在datas数据中判断是否存在key=value，存在则返回data
        isKeyValueByDatas: (datas, key, value, isEqual = true, isBreakFuc = () => false, otherKeysFuc = () => true) => {
            if (Tools.alertFuc({ datas, key, value })) return false;
            function escapeRegExp(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\$&'); // $& 表示匹配的内容
            }
            // 自动转义特殊字符
            const escapedValue = escapeRegExp(value).replaceAll(/\*{1,}/g, '.+');
            // 创建正则表达式
            const regexp = new RegExp(escapedValue + '$');
            // console.log(regexp,escapedValue);
            let result = false;
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                const val = data[key];
                if (val && (isEqual ? Tools.trim(val) == Tools.trim(value) : regexp.test(val)) && otherKeysFuc(data, i)) {
                    result = { data, index: i };
                    break;
                }
                if (isBreakFuc(data, i)) break;
            }
            return result;
        },
        getCon: (arr, len) => {
            let str = '';
            const datas = arr || Tools.getShortDatas(arr, len);
            datas.forEach(data => {
                str += `<div>${typeof data === 'string' ? data : JSON.stringify(data)}</div>`;
            })
            return str;
        },
        // key=value搜索phone[[key,value]]
        // searchAccountsByKeyValues: (arr = []) => {
        // if (arr.length == 0) return alert('请输入[[key,value]]');
        // // return;
        // let phone_arr = [];
        // for (let phone in DATA) {
        //     const datas = DATA[phone];
        //     let is = false;
        //     arr.forEach(keyValue => {
        //         const [key, value] = keyValue;
        //         if (value && Tools.isKeyValueByDatas(datas, key, value)) {
        //             is = true;
        //         }
        //     })
        //     if (is) phone_arr.push(phone);
        // }
        // // 去重
        // phone_arr = [...new Set(phone_arr)];
        // return phone_arr;
        // },
        // 找到字段对应的account[[key,value]]
        findAccountsBykeyValue: (arr = [], otherKeysFuc = () => true, isEqual, isBreakFuc) => {
            if (arr.length == 0) return alert('请输入[[key,value]]');
            let phone_arr = [];
            for (let phone in DATA) {
                const datas = DATA[phone];
                for (let i = 0; i < arr.length; i++) {
                    const [key, value] = arr[i];
                    if (value && Tools.isKeyValueByDatas(datas, key, value, isEqual, isBreakFuc, otherKeysFuc)) {
                        phone_arr.push(phone);
                        break;
                    }
                }
            }
            // 去重
            phone_arr = [...new Set(phone_arr)];
            return phone_arr;
            // const results = [];
            // const accounts = Object.keys(DATA);
            // accounts.forEach(account => {
            //     const datas = DATA[account];
            //     for (let i = 0; i < datas.length; i++) {
            //         const data = datas[i];
            //         // console.log(data[key],value,key,data)
            //         if (Tools.trim(data[key]) == Tools.trim(value) && otherKeysFuc(data,i)) {
            //             if(!remind){
            //                 results.push(account);
            //                 break;
            //             }else{
            //                 if(!data.is_remind && !RDATA.isExist(account,remind)){
            //                     results.push(account);
            //                     break;
            //                 }
            //             }
            //         }
            //         if(isBreakFuc(data,i))break;
            //     }
            // })
            // // console.log(results);
            // return results;
        },
        // 修改data
        updataDataByAccount: (pig_phone, valueObj = {}, judgeFuc = () => { return false; }) => {
            if (Tools.alertFuc({ pig_phone })) return false;
            const datas = DATA[pig_phone];
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                const result = judgeFuc(data, i);
                if (result) {
                    Object.assign(DATA[pig_phone][i], valueObj);
                }
                if (result == 'break') break;
            }
            storageData();
            return true;
        },
        // 通过datas找到所有的keys=data[] | string[]
        findKeysByDatas: (datas, key, otherJudge = () => '1', is_complete = false) => {
            let arr = [];
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                const result = otherJudge(data, i);
                // console.log(data,data[key],result,key);
                if (data[key] && result) {
                    arr.push(is_complete ? data : data[key]);
                    if (result === 'break') {
                        break;
                    }
                }
            }
            // datas.forEach((data,index) => {
            //     if (data[key] && otherJudge(data,index)) {
            //         arr.push(is_complete ? data : data[key]);
            //     }
            // })
            // 去重
            return arr = [...new Set(arr)];
        },
        // 通过keyvalue找到所有data
        findDataBykeyVlueByDatas: (datas, keyvalues = {}) => {
            let arr = [];
            datas.forEach(data => {
                let is = true;
                Object.keys(keyvalues).forEach(key => {
                    if (data[key]!=keyvalues[key]) is = false;
                })
                if (is) {
                    arr.push(data);
                }
            })
            return arr;
        },
        // 展示数据
        displayAccounts: (accounts, code = true, sort = true, btns = false, max = 5, highLightStr) => {
            // 排序
            if (sort) {
                let str = 'pig_over_time';
                if (typeof sort === 'string') {
                    str = sort;
                }
                accounts.sort((a, b) => {
                    if (DATA[a].length > 0 && DATA[b].length > 0 && (typeof sort == 'function' ? sort(DATA[a], DATA[b]) : (new Date(DATA[a][0]['pig_over_time']) > new Date(DATA[b][0]['pig_over_time'])))) {
                        return 1;
                    } else {
                        return -1;
                    }
                })
            }
            if (accounts.length == 0) return ['没有找到做单记录'];
            let dyStr = '';
            if (accounts.length > max) {
                dyStr += `<div style="margin-bottom: 10px; color:gray;text-align: center">....还剩下<span style="color:red;">${accounts.length - max}</span>个.....</div>`
            }
            const phoneDatas = [];
            const forLen = accounts.length < max ? accounts.length : max;
            for (let i = 0; i < forLen; i++) {
                phoneDatas.push(DATA[accounts[i]]);
            }
            const table = getDataTable(phoneDatas, typeof btns == 'boolean' ? btns ? [{ text: '更新7天提醒', className: 'j-remindPhone', type: 'comment_reminder' }, { text: '不再提醒', className: 'j-no-remind' }] : [] : btns, undefined, highLightStr);
            // 源码
            let str = phoneDatas.reduce((a, data, index) => {
                return a + Tools.getCon(data) + (index <= phoneDatas.length - 2 ? '<div style="border-top:1px dashed #c2b7cd; margin: 10px 0;"></div>' : '');
            }, '');
            return [dyStr + table, code ? str : ''];
        },
        // 通过某个条件找到所有的数据并显示
        displayAccountByKeyValue: (arr, otherKeysFuc, isBreakFuc = (data, i) => i == 0, sort1) => {
            const accounts = Tools.findAccountsBykeyValue(arr, otherKeysFuc, true, isBreakFuc);
            // console.log(arr);
            // console.log(otherKeysFuc);
            // console.log(isBreakFuc);
            // console.log(sort1);
            return Tools.displayAccounts(accounts, undefined, sort1, true);
        },
        // 提醒是否添加了微信
        RemindAddWx: (pig_phone, remind_add_wx) => {
            if (Tools.alertFuc({ pig_phone, remind_add_wx })) return false;
            const result = Tools.modifyDataToLastRecord(pig_phone, { remind_add_wx });
            return result;
        },
        // 找到提醒是否添加了微信
        findRemindAddWx: (datas) => {
            const arr = Tools.findKeysByDatas(datas, 'remind_add_wx');
            return arr.length > 0 ? arr[0] : '';
        },
        // 添加真实姓名
        addRealName: (pig_phone, real_name) => {
            if (Tools.alertFuc({ pig_phone, real_name })) return false;
            const result = Tools.modifyDataToLastRecord(pig_phone, { real_name });
            alert('仔细核对以前的旺旺跟姓名，防止被骗！！！！！！！！！！！！！！！')
            return result;
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
            const result_reg = reg.exec(wx_name.replace(/\*+/g, '.+?'));
            if (result_reg) {
                wx_name_tmp = result_reg[1];
                real_name_tmp = result_reg[2];
                // console.log(result_reg);
                // 找到真实的姓名
                let real = Tools.findKeysByDatas(DATA[pig_phone], 'real_name', (data) => {
                    // 把多个**替换下
                    let tmp = real_name_tmp.replace(/\*+/g, '.+?');
                    // console.log(tmp);
                    return new RegExp(tmp).exec(data.real_name);
                }, false);
                // console.log(real);
                if (real.length > 0) {
                    real_name_tmp = real[0];
                } else {
                    alert('没有找到真实姓名');
                    return false;
                }

            }
            if (Tools.alertFuc({ wx_name_tmp, real_name_tmp })) return false;
            return Tools.addKeyValue(pig_phone, 'wx_name', wx_name_tmp, () => {
                // 判断不能重复添加
                let result = true;
                for (let data of DATA[pig_phone]) {
                    if (data.wx_name && data.real_name == real_name_tmp) {
                        alert('一个真实姓名对应一个wx名字');
                        result = false;
                        break;
                    }
                }
                return result;
            }, () => {
                return { real_name: real_name_tmp };
            }, undefined, true)
        },
        // 删除真实姓名对应的微信名字
        delRealNameWxName: (pig_phone, wx_name) => {
            if (Tools.alertFuc({ pig_phone, wx_name })) return false;
            return Tools.delKeyValue(pig_phone, 'wx_name', wx_name, undefined, (data) => !data.real_name, false);
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
        // 添加等待处理
        addWait: (account) => {
            return Tools.addKeyValue(account, 'wait', '1', undefined, undefined, undefined, true);
        },
        // 删除等待处理
        delWait: (account) => {
            return Tools.delKeyValue(account, 'wait', '1', undefined, undefined, false);
        },
        // 更新等待处理
        updateWait: (account) => {
            return Tools.updataDataByAccount(account, { create_time: new Date().toLocaleString() }, (data) => {
                return data.wait;
            })
        },
        // 是否待处理
        IsWaitByDatas: (datas) => {
            return Tools.findKeysByDatas(datas, 'wait').length > 0;
        },
        // 找到所有的wait的账号
        findAccountsByWait: () => {
            let account = Tools.findAccountsBykeyValue([['wait', '1']]);
            account.sort(function (a, b) {
                const aData = DATA[a];
                const bData = DATA[b];
                const aWait = Tools.findKeysByDatas(aData, 'wait', undefined, true);
                const bWait = Tools.findKeysByDatas(bData, 'wait', undefined, true);
                // console.log(aWait[0]?.create_time,aWait[0].pig_phone,bWait[0]?.create_time,bWait[0].pig_phone)
                if (new Date(aWait[0]?.create_time) < new Date(bWait[0]?.create_time)) {
                    return -1;
                } else {
                    return 1;
                }
            })
            // console.log(account);
            return account;
        },
        // 添加团队
        addTeamer: (account, teamer) => {
            return Tools.addKeyValue(account, 'teamer', teamer, undefined, undefined, undefined, true);
        },
        // 找到团队
        findTeamersByDatas: (datas) => {
            return Tools.findKeysByDatas(datas, 'teamer');
        },
        // 添加佣金
        addCommission: (account, commission) => {
            return Tools.addKeyValue(account, 'commission', commission, undefined, undefined, undefined, true);
        },
        // 删除佣金
        delCommission: (account, commission) => {
            return Tools.delKeyValue(account, 'commission', commission);
        },
        // 找到佣金
        findCommission: (datas) => {
            const arr = Tools.findKeysByDatas(datas, 'commission');
            if (arr.length > 0) return arr[0];
            // 判断QQ-开头的是6
            if (datas.length > 0 && datas[0].pig_phone.includes('QQ-')) {
                return 6;
            }
            // 如果是唐人id
            if (datas.length > 0 && Tools.isTangId(datas[0].pig_phone)) {
                return 6;
            }
            // 从做单渠道判断
            if (datas.length > 0 && datas[0].come_type) {
                const commission = Tools.findComeType(datas[0].come_type)?.commission;
                if (commission) return commission;
                return 6;
                // if (['pig'].includes(datas[0].come_type)) {
                //     return 7;
                // } else if (['tang'].includes(datas[0].come_type)) {
                //     return 6;
                // }
            }
            return '';
        },
        // 添加唐人id
        addTangId: (account, tang_id) => {
            return Tools.addKeyValue(account, 'tang_id', tang_id, undefined, undefined, undefined, true);
        },
        // 找到唐人id
        findTangId: (datas) => {
            const arr = Tools.findKeysByDatas(datas, 'tang_id');
            return arr.length > 0 ? arr[0] : '';
            // let tang_id;
            // datas.forEach((data)=>{
            //     if(data.tang_id)tang_id = data.tang_id;
            // })
            // return tang_id;
        },
        // 添加昵称
        addNickname: (account, nickname) => {
            return Tools.addKeyValue(account, 'nickname', nickname);
        },
        // 找到昵称
        findNickname: (datas) => {
            const arr = Tools.findKeysByDatas(datas, 'nickname');
            return arr.length > 0 ? arr[0] : '';
        },
        // 添加唐人注册时间
        addTangRegisterTime: (account, tang_register_time) => {
            return Tools.addKeyValue(account, 'tang_register_time', tang_register_time, undefined, undefined, undefined, true);
        },
        // 找到唐人注册时间
        findTangRegisterTime: (datas) => {
            const arr = Tools.findKeysByDatas(datas, 'tang_register_time');
            return arr.length > 0 ? arr[0] : '';
            // let tang_register_time;
            // datas.forEach((data)=>{
            //     if(data.tang_register_time)tang_register_time = data.tang_register_time;
            // })
            // return tang_register_time;
        },
        // 添加手机号
        addMobile: (account, mobile) => {
            return Tools.addKeyValue(account, 'mobile', mobile);
        },
        // 删除手机号
        delMobile: (account, mobile) => {
            return Tools.delKeyValue(account, 'mobile', mobile);
        },
        // 找到所有mobiles
        findMobilesByDatas: (datas, mobile = '1') => {
            const arr = [];
            datas.forEach(data => {
                if (data.mobile && data.mobile != mobile && !arr.includes(data.mobile)) {
                    arr.push(data.mobile);
                }
            })
            return arr;
        },
        // 添加京东号
        addJd: (account, jd) => {
            return Tools.addKeyValue(account, 'jd', jd);
        },
        // 删除京东号
        delJd: (account, jd) => {
            return Tools.delKeyValue(account, 'jd', jd);
        },
        // 添加京东昵称
        addJdNickname: (account, jd, jd_nickname) => {
            return Tools.updataDataByAccount(account, { jd_nickname }, (data) => {
                if (data.jd == jd) return 'break';
            })
        },
        // 找到所有的京东号
        findJdsByDatas: (datas) => {
            return Tools.findKeysByDatas(datas, 'jd', undefined, true);
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
            const result = Tools.addKeyValue(pig_phone, 'ww_exec', ww_exec);
            alert('仔细核对以前的旺旺跟姓名，防止被骗！！！！！！！！！！！！！！！')
            return result;
        },
        // 删除旺旺
        delWW: (pig_phone, ww_exec) => {
            return Tools.delKeyValue(pig_phone, 'ww_exec', ww_exec);
        },
        // 添加第二个旺旺号
        addWWBackFirst: (pig_phone, ww_exec) => {
            const datas = DATA[pig_phone];
            let first;
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                if (data.ww_exec) {
                    first = i;
                    break;
                }
            }
            // for (let index in datas) {
            //     const data = datas[index];
            //     if (data.ww_exec) first = index;
            // }
            return Tools.addKeyValue(pig_phone, 'ww_exec', ww_exec, undefined, undefined, first);
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
            // const arr = [];
            // datas.forEach(data => {
            //     if (data.pig_qq && data.pig_qq != qq && !arr.includes(data.pig_qq)) {
            //         arr.push(data.pig_qq);
            //     }
            // })
            return Tools.findKeysByDatas(datas, 'pig_qq').filter(q => q != qq);;
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
        // 给旺旺添加性别
        addGenderByAccount: (pig_phone, ww, gender) => {
            return Tools.updataDataByAccount(pig_phone, { gender }, (data, index) => {
                if (data.ww_exec == ww) {
                    return 'break';
                }
            })
        },
        // 给旺旺添加备注
        addWwNoteByAccount: (pig_phone, ww, note) => {
            const obj = { note, note_create_time: Tools.getTime() };
            if (note.includes('被抓')) {
                obj.is_del = "1";
            }
            return Tools.updataDataByAccount(pig_phone, obj, (data, index) => {
                if (data.ww_exec == ww) {
                    return 'break';
                }
            })
        },
        // 添加wx
        addWx: (pig_phone, wx) => {
            // Tools.addContact(pig_phone,'wx',wx);
            return Tools.addKeyValue(pig_phone, 'wx', wx);
        },
        // 删除wx
        delWx: (pig_phone, wx) => {
            return Tools.delKeyValue(pig_phone, 'wx', wx, undefined, undefined, false);
        },
        // 给wx添加wx_name
        addWxNameByWx: (pig_phone, wx, wx_name) => {
            return Tools.updataDataByAccount(pig_phone, { wx_name }, (data, index) => {
                return data.wx == wx;
            })
        },
        // 找到所有的wx对应的微信名字
        findWxWxNamesByDatas: (datas) => {
            const wxs_arr = Tools.findKeysByDatas(datas, 'wx', undefined, true);
            const results = {};
            wxs_arr.forEach(wx_obj => {
                if (wx_obj.wx) {
                    results[wx_obj.wx] = wx_obj.wx_name;
                }
            })
            return results;
        },
        // 找到所有的wxs
        findWxsByDatas: (datas, isHaveWxNameAdd = false) => {
            const wx_wx_names = Tools.findWxWxNamesByDatas(datas);
            return Object.keys(wx_wx_names).map(wx => {
                if (wx_wx_names[wx] && isHaveWxNameAdd) {
                    return `${wx}${isHaveWxNameAdd ? `<span style="color:gray;font-size:12px;">（${wx_wx_names[wx]}）</span>` : ''}`;
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
                if ((!data['pig_note'] && pig_note != 'TB') && data['pig_type'] != pig_type) return true;
                return false;
            }, false)
        },
        // 找到phone数据里面的note数据obj
        findNotesByDatas: (datas, pig_type = 'TB') => {
            // const arr = [];
            // datas.forEach(data => {
            //     const obj = Tools.copyObj(data);
            //     if (!obj.pig_type) obj.pig_type = 'TB';
            //     if (obj.pig_type == pig_type && obj.pig_note) arr.push(obj);
            // })
            return Tools.findKeysByDatas(datas, 'pig_note', (data, i) => {
                if (!data.pig_type) {
                    if (pig_type == 'TB') return true;
                } else {
                    if (data.pig_type == pig_type) return true;
                }
            }, true);
        },
        // 通过账号给最后一个记录添加评论或者默认评论或者直接评论
        lastAddCommentByPhone: (account, is_comment = '1', pig_type) => {
            return Tools.updataDataByAccount(account, { is_comment, comment_time: new Date().toLocaleString() }, (data, i) => {
                if (data.pig_type == pig_type) {
                    return 'break';
                }
            });
            // if (Tools.alertFuc({ phone, is_comment })) return false;
            // if (!DATA[phone]) {
            //     alert('找不到对应的记录~')
            //     return false;
            //     // DATA[phone] = [];
            // }
            // DATA[phone][0].is_comment = is_comment;
            // storageData();
            // return true;
        },
        isTangId: (account) => {
            // 如果是8位纯数字
            if (/^\d{8}$/.test(account)) return true;
            return false;
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
        addRecordBtn: (phone, parentNode, text, qq, mobile) => {
            const button = document.createElement('button');
            button.className = 'search_btn';
            button.innerHTML = text || "添加记录";
            button.addEventListener('click', () => {
                if (typeof phone == 'function') phone = phone();
                const result = Tools.addRecord(phone);
                if (qq) Tools.addQq(phone, qq);
                if (mobile) Tools.addMobile(phone, mobile);
                if (result) alert('添加记录成功~');
                // 如果是唐人id
                if (Tools.isTangId(phone)) Tools.addTangId(phone, phone);
                location.reload();
            }, false)
            if (parentNode) {
                parentNode.append(button);
            }
            return button;
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
            // 针对come_type的bug
            if (keys.includes('come_type') && !obj['come_type'] && datas.length > 0 && datas[0].pig_over_time) {
                obj['come_type'] = 'pig';
            }
            return obj;
        },
        // 找到注册时间
        findRegisterTimeByDatas: (datas) => {
            // return Tools.findLastKeyValuesByDatas(datas, ['pig_register_time']).pig_register_time;
            // let register_time = '';
            // for (let i = 0; i < datas.length; i++) {
            //     if (datas[i].pig_register_time) {
            //         register_time = datas[i].pig_register_time;
            //         break;
            //     }
            // }
            // return register_time;
            const register_time = Tools.findKeysByDatas(datas, 'pig_register_time', (data, i) => {
                if (data.pig_register_time) {
                    return 'break';
                }
            })[0]
            const create_time_arr = Tools.findKeysByDatas(datas, 'create_time');
            // 找到create_time_arr最早的时间
            const create_time = create_time_arr.sort((a, b) => {
                return new Date(a) - new Date(b);
            })[0];
            return register_time ? register_time : create_time;
        },
        // 判断是否是做单记录
        isRecord: (data) => {
            if (data.pig_over_time) return true;
            return false;
        },
        // 汇总phone数据里面的店铺数据
        findShopLabelsByDatas: (datas, switch_time = [], record_color) => {
            const results = [];
            datas.forEach((data, index) => {
                // 添加已换号
                if (switch_time.length > 0) {
                    switch_time.forEach((time, index) => {
                        // 3天误差
                        if (new Date(new Date(time).getTime() - 3 * 24 * 60 * 60 * 1000) > new Date(data.pig_over_time)) {
                            results.unshift('<span style="color:red;">已换号</span>');
                            switch_time.splice(index, 1);
                        }
                    })
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
                    // 筛选出来连续做单错误记录不公平
                    if (datas[index - 1] && new Date(new Date(data.pig_over_time).getTime() + 0 * 24 * 60 * 60 * 1000) > new Date(datas[index - 1].pig_over_time)) {
                        return false;
                    }
                    return true;
                }
                return false;
            });
            // return Tools.findAccountsBykeyValue()
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
                // console.log(datas);

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
        modifyDataToLastRecord: (account, obj = {}) => {
            return Tools.updataDataByAccount(account, obj, (data, i) => i == 0);
            // Object.assign(DATA[phone][0], obj);
            // storageData();
            // return true;
        },
        // 不再提醒
        noRemind: (account) => {
            return Tools.updataDataByAccount(account, { is_remind: '-1' }, (data, i) => i == 0);
            // DATA[phone][0].is_remind = '-1';
            // storageData();
        },
        // 通过keyword找到phone搜索范围qq,phone,note,ww,nickname
        findPhonesByKeyword: (keyword) => {
            // console.log(keyword);
            const results = [];
            if (!keyword) return results;
            const emptyStr = function (str, key) {
                if (str) {
                    str = str.trim();
                    return str == key.trim();
                } else {
                    return false;
                }
            }
            for (let phone in DATA) {
                const datas = DATA[phone];
                datas.forEach(data => {
                    if (emptyStr(data.pig_qq, keyword) || emptyStr(data.pig_phone, keyword) || emptyStr(data.ww_exec, keyword) || emptyStr(data.wx, keyword) || emptyStr(data.wx_name, keyword) || emptyStr(data.mobile, keyword) || emptyStr(data.jd, keyword) || emptyStr(data.jd_nickname, keyword) || emptyStr(data.nickname ? data.nickname.replace('A97', '') : '', keyword) || emptyStr((data.real_name && data.real_name.includes('*')) ? '' : data.real_name, keyword) || (data.pig_note && data.pig_note.indexOf(keyword) != -1) || emptyStr(data.note, keyword)) {
                        if (!results.includes(phone)) results.push(phone);
                    }
                })
            }
            return [...new Set(results)];
        },
        // 通过keyword_arr找到phone搜索
        findPhonesByKeywords: (keywords) => {
            let results = [];
            if (!keywords || keywords.length == 0) return results;
            keywords.forEach(keyword => {
                results = results.concat(Tools.findPhonesByKeyword(keyword));
            })
            // 去重
            results = [...new Set(results)];
            return results;
        },
        // 通过keyword找到所有keyword返回qq,phone,ww,wx_name,nickname,real_name数组
        findAllKeywordByKeyword: (keyword) => {
            const phones = Tools.findPhonesByKeyword(keyword);
            // console.log(phones);
            const arr = [];
            const pushData = function (str) {
                if (str) {
                    str = str.trim();
                    if (!arr.includes(str)) {
                        arr.push(str);
                    }
                }
            }
            phones.forEach(phone => {
                const datas = DATA[phone];
                datas.forEach(data => {
                    [data.pig_qq, data.pig_phone, data.ww_exec, data.wx, data.wx_name, data.mobile, data.jd, data.jd_nickname, data.nickname ? data.nickname.replace('A97', '') : '', (data.real_name && data.real_name.includes('*')) ? '' : data.real_name].forEach(str => {
                        // console.log(str+'1111');
                        pushData(str);
                    })
                    // if (data.pig_qq && !arr.includes(data.pig_qq)) arr.push(data.pig_qq);
                    // if (data.pig_phone && !arr.includes(data.pig_phone)) arr.push(data.pig_phone);
                    // if (data.ww_exec && !arr.includes(data.ww_exec)) arr.push(data.ww_exec);
                    // if (data.wx && !arr.includes(data.wx)) arr.push(data.wx);
                    // if (data.wx_name && !arr.includes(data.wx_name)) arr.push(data.wx_name);
                })
            })
            // console.log(arr);
            return [...new Set(arr)];
        },
        // 全能搜索得到phone keywords=[qq,phone,ww]
        almightySearch: (keywords = []) => {
            let result = [];
            if (keywords.length == 0) return result;
            // console.log(keywords);
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
        //找到来自渠道
        findComeType: (value) => {
            let result;
            COMETYPE.forEach(come_type => {
                if (come_type.value == value) result = come_type;
            })
            return result;
        },
        //找到做单渠道name
        findNameByComeTypeValue: (value) => {
            // let result = value;
            // COMETYPE.forEach(come_type => {
            //     if (come_type.value == value) result = come_type.name;
            // })
            const name = Tools.findComeType(value)?.name;
            return name ? name : '';
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
        remindText: (datas) => {
            const remind_text_arr = ['骗子', '不给单', '不放单', '不再给单', '拉黑', '可疑', '黑名单', '注意'];
            let remind_text = [];
            let json = JSON.stringify(datas);
            remind_text_arr.forEach(text => {
                if (json.includes(text)) remind_text.push(text);
            })
            return remind_text;
        }
    }
    // 初始化数据
    // Tools.formateWwFromData();
    // storageData();

    // const DATA = getData();
    // const DATA = {
    //     '18829904058':[
    //         {
    //             "task_id": "4669667",
    //             "pig_phone": "18829904058",
    //             "pig_qq": "1576630003",
    //             "pig_register_time": "2022-02-19 14:22:33",
    //             "pig_over_time": "2022-09-05 13:31:20"
    //         },
    //         {
    //             "task_id": "4669667222",
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
    const humanDatas = (datas, qq = "1", pig_type = 'TB', is_almighty = true) => {
        const pig_phone = datas.length > 0 && datas[0].pig_phone;
        // 备注数据
        let notes = Tools.findNotesByDatas(datas, pig_type);
        // pig_type做单数据
        let records = Tools.getDatasByPigType(datas, pig_type);
        // 找到所有的qq号
        let qqs = Tools.findQqsByDatas(datas, qq);
        // 找到所有的手机号
        let mobiles = Tools.findMobilesByDatas(datas, pig_phone);
        // 找到不同的账号
        // let diffPhones = findDiffPhonesByDatas(datas);
        let diffPhones = is_almighty ? Tools.almightySearch([pig_phone]).filter(phone => phone != pig_phone) : [];
        // 找到真实姓名
        const real_name_arr = Tools.findRealNamesByDatas(datas);
        // 找到最近做单类型
        const last_recode_type = (datas[0] && datas[0].pig_type) ? datas[0].pig_type : '';
        // 最近的做单记录
        const last_recode = datas[0];
        // 找到注册时间
        let register_time = Tools.findRegisterTimeByDatas(datas);
        // 找到唐人注册时间
        const tang_register_time = Tools.findTangRegisterTime(datas);
        // 找到唐人id
        const tang_id = Tools.findTangId(datas);
        // 找到昵称
        const nickname = Tools.findNickname(datas);
        // 找到提醒是否添加了微信
        const remind_add_wx = Tools.findRemindAddWx(datas);
        // 找到佣金
        const commission = Tools.findCommission(datas);
        // 找到所有团队
        const teamers = Tools.findTeamersByDatas(datas);
        // 找到所有京东账号
        const jds = Tools.findJdsByDatas(datas);
        // 是否待处理账号
        const is_wait = Tools.IsWaitByDatas(datas);
        // 找到真实姓名对应的微信名字
        const wx_names = Tools.findRealNameWxNamesByDatas(datas) || {};
        // 提醒文本
        const remind_texts = Tools.remindText(datas);
        function formateDatasByPigType(datas, pig_type) {
            // 做单数据
            const records = Tools.getDatasByPigType(datas, pig_type);
            // 备注数据
            let notes = Tools.findNotesByDatas(datas, pig_type);
            // 记录颜色
            const record_color = records.length > 0 && records[0].qq_exec_pre && QQS[records[0].qq_exec_pre].color || '';
            // 切换时间
            let switch_time = [];
            notes.forEach(note => {
                if (note.pig_note && note.pig_note.indexOf('已换号') !== -1) {
                    switch_time.push(note.create_time);
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
        // const wws_html = wws.reduce((a, b) => {
        //     return a + (b.is_del ? `<del class="j-copyText" style="color:gray;display:block;">${b.ww_exec}</del>` : `<p class="j-copyText">${b.ww_exec}</p>`);
        // }, '');
        // 找到所有的wxs
        const wxs = Tools.findWxsByDatas(datas, true);
        // 找到分类做单数据
        const order_type_datas = {};
        ORDERTYPES.forEach(type => {
            order_type_datas[type] = formateDatasByPigType(datas, type);
        });
        return {
            phone: datas.length > 0 && datas[0].pig_phone,
            real_names: real_name_arr,
            qqs: qqs,
            notes: notes.map(note => note.pig_note),
            records: records,
            typeDatas: order_type_datas,
            register_time: register_time,
            tang_register_time: tang_register_time,
            tang_id: tang_id,
            last_recode_type: last_recode_type,
            last_recode:last_recode,
            commission: commission,
            nickname: nickname,
            remind_add_wx: remind_add_wx,
            teamers: teamers,
            is_wait: is_wait,
            record_time: records.length > 0 && records[0].pig_over_time,
            record_qq: records.length > 0 && records[0].qq_exec_pre && (QQS[records[0].qq_exec_pre].text || ''),
            record_color: records.length > 0 && records[0].qq_exec_pre && (QQS[records[0].qq_exec_pre].color || ''),
            record_num: records.length,
            diffPhones: diffPhones,
            mobiles: mobiles,
            wwExecs: wws.map(ww => ww.ww_exec),
            wws: wws,
            wxs: wxs,
            wx_names: wx_names,
            jds: jds,
            remind_texts, remind_texts,
        }
    }

    function trim(str) {
        if (!str) return str;
        // str = str.replace(/\ +/g, '');
        // str = str.replace(/[\r\n\t]/g, '');
        str = str.trim();
        return str;
    }
    // 得到做单的trs
    function getDataTable(records, btn = [{ text: '标注已评价', className: 'j-addComment', texted: "已评价", val: '1' }, { text: '标注默认评价', className: 'j-addComment', texted: '已默认评价', val: '-1' }], record_length = records.length, highLightStr = '') {
        // console.log(record_length);
        let trs = '';
        // const defBtns = [{ text: '标注已评价', className: 'j-addComment', texted: "已评价", val: '1' }, { text: '标注默认评价', className: 'j-addComment', texted: '已默认评价', val: '-1' }];
        records.forEach(datas => {
            let humanData = humanDatas(datas);
            // console.log(humanData);
            let btnStr = '';
            if (typeof btn == 'string' && btn) {
                btnStr = btn;
            }
            if (Object.prototype.toString.call(btn) == '[object Object]') {
                btnStr = `<a style="color:red;margin-left:10px;cursor:pointer;" class="${btn.className}" data-qq="${humanData.qqs[0] ? humanData.qqs[0] : ''}" data-phone="${humanData.phone}" data-mobile="${humanData.mobiles[0]}" data-datas="${JSON.stringify(btn).replaceAll('"', "'")}">${btn.text}</a>`;
            }
            if (Object.prototype.toString.call(btn) == '[object Array]') {
                btnStr += '<div style="margin-top:10px;margin-right:-10px;">';
                btn.forEach(bt => {
                    btnStr += `<a style="color:red;margin-right:10px;cursor:pointer;" class="${bt.className}" data-qq="${humanData.qqs[0] ? humanData.qqs[0] : ''}" data-phone="${humanData.phone}" data-mobile="${humanData.mobiles[0]}" data-datas="${JSON.stringify(bt).replaceAll('"', "'")}">${bt.text}</a>`;
                })
                btnStr += '</div>';
            }
            trs += `
            <tr data-account="${humanData.phone}" data-mobile="${humanData.mobiles[0]}">
                <td>
                    ${humanData.commission ? `<p style="color:darkturquoise;font-size:25px;">+${humanData.commission}，jd+6</p>` : ''}
                    <p>${humanData.remind_texts.length > 0 ? `<span style="display:block;color:red;font-size:30px;">${humanData.remind_texts.join(',')}</span>` : ''}
                    <span class="j-phone j-copyText">${Tools.highLightStr(humanData.phone, highLightStr)}</span>${btnStr}</p>
                    ${humanData.diffPhones.length > 0 ? ('<p style="color:red;">有不同的账号：' + JSON.stringify(humanData.diffPhones) + '</p>') : ''}
                    ${humanData.tang_id > 0 ? `<p style="margin-top:15px;"><span style="color:blueviolet;">唐人id：</span><span class="j-copyText">${humanData.tang_id}</span></p>` : ''}
                    ${humanData.teamers.length > 0 ? `<p style="color:blue;">属于团队：${humanData.teamers.map(teamer => TEAMERS[teamer].text)}</p>` : ''}
                    ${humanData.nickname ? `<p style="color:gray;"><span>昵称：</span><span class="j-copyText">${humanData.nickname}</span></p>` : ''}
                </td>
                <td style="color: blueviolet;">
                    ${humanData.qqs.length > 0 ? `<p style="margin-top:15px; color:gray;">全部qqs：</p>${humanData.qqs.reduce((a, b) => {
                return a + `<p class="j-copyText">${Tools.highLightStr(b, highLightStr)}</p>`;
            }, '')}` : ''}
                ${humanData.wxs.length > 0 ? `<p style="margin-top:15px; color:gray;">全部wxs：</p>${humanData.wxs.reduce((a, b) => {
                return a + `<p class="j-copyText">${Tools.highLightStr(b, highLightStr)}</p>`;
            }, '')}` : humanData.remind_add_wx?'':'<p style="margin-top:15px; color:gray;">全部wxs：</p><button class="search_btn j-RemindAddWx">是否添加了wx</button>'}
                ${humanData.mobiles.length > 0 ? `<p style="margin-top:15px; color:gray;">全部mobiles：</p>${humanData.mobiles.reduce((a, b) => {
                return a + `<p class="j-copyText">${Tools.highLightStr(b, highLightStr)}</p>`;
            }, '')}` : ''}
                </td>
                <td style="color:red;">
                    ${humanData.wws.length > 0 ? `<p style="margin-top:15px; color:gray">全部wws：</p>${humanData.wws.reduce((a, b) => {
                return a + `<p class="${b.is_del == '1' ? 'del' : ''}">
                                <span class="j-copyText">${Tools.highLightStr(b.ww_exec, highLightStr)}</span>
                                ${b.gender != undefined ? `（<span class="blue">${b.gender == 1 ? '男' : '女'}</span>）` : ''}
                                ${b.note ? `（<span class="cadetblue j-copyText">${b.note}</span>）` : ''}
                            </p>`;
            }, '')}` : ''}
                    ${humanData.jds.length > 0 ? `<p style="margin-top:15px; color:gray">全部jds：</p>${humanData.jds.reduce((a, b) => {
                return a + `<p><span class="j-copyText">${Tools.highLightStr(b.jd, highLightStr)}</span>${b.jd_nickname ? `<br/>（<span class="cadetblue j-copyText">${Tools.highLightStr(b.jd_nickname, highLightStr)}</span>）` : ''}</p>`;
            }, '')}` : ''}
                </td>
                <td>${humanData.real_names.reduceRight((a, real_name) => a + `<p class="j-copyText">${real_name}${humanData.wx_names[real_name] ? `（<span style="color:gray;font-size:12px;">${humanData.wx_names[real_name]}</span>）` : ''}</p>`, '')}</td>
                <td>
                    <table style="width:100%;">
                        <tbody>
                            <tr>
                                <th></th>
                                ${ORDERTYPES.map(type => `<th class="${type == humanData.last_recode_type ? 'bg-blue' : ''}">${type}</th>`).join('')}
                            </tr>
                            <tr>
                                <td>最近做单渠道</td>
                                ${ORDERTYPES.map(type => `<td style="color:gray;">${Tools.findNameByComeTypeValue(humanData.typeDatas[type].record_come_type)}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>最近做单渠道号</td>
                                ${ORDERTYPES.map(type => `<td style="color:${humanData.typeDatas[type].record_color}">${humanData.typeDatas[type].record_qq}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>最近做单日期</td>
                                ${ORDERTYPES.map(type => `<td style="color:red;">${humanData.typeDatas[type].record_time}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>已做单数量</td>
                                ${ORDERTYPES.map(type => `<td style="color: rgb(16, 0, 255);">${humanData.typeDatas[type].record_num}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="min-width:86px;">做单店铺顺序</td>
                                ${ORDERTYPES.map(type => `<td style="max-width:170px;padding:10px;">${humanData.typeDatas[type].record_shop_labels || ''}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>最近评论状态</td>
                                ${ORDERTYPES.map(type => `<td>${humanData.typeDatas[type].record_comment == '1' ? '<span style="color:gray;">已经评价</span>' : humanData.typeDatas[type].record_comment == '-1' ? '<span style="color:rgb(16, 0, 255);">默认评价</span>' : humanData.typeDatas[type].record_comment || humanData.typeDatas[type].record_num > 0 ? `<a style="color:cadetblue;margin-right:10px;cursor:pointer;" class="j-addComment" data-val="1" data-type="${type}">标注已评价</a><a style="color:cadetblue;cursor:pointer;" class="j-addComment" data-val="-1" data-type="${type}">标注默认评价</a>` : ''}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>备注</td>
                                ${ORDERTYPES.map(type => `<td style="color:red;">
                                        ${humanData.typeDatas[type].notes.reduce((a, b) => {
                return a + `<p class="j-copyText">${Tools.highLightStr(b, highLightStr)}</p>`;
            }, '')}
                                    </td>`).join('')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td>
                ${humanData.register_time || ''}
                ${humanData.tang_register_time ? `<p style="margin-top:15px; color:red;">唐人注册时间：</p><p>${humanData.tang_register_time}</p>` : ''}
                ${humanData.is_wait ? `<p style="margin-top:15px; color:violet; "><span style="cursor:pointer;" class="j-wait-del" data-account="${humanData.phone}">待处理</span><span style="cursor:pointer; margin-left:10px;" class="j-wait-update" data-account="${humanData.phone}">更新处理</span></p>` : ''}
                </td>
            </tr>
            `
        })
        let table = `
        <div style="margin-bottom: 10px; color:gray;text-align:center;">....搜索到<span style="color:red;">${record_length}</span>个结果${record_length > records.length ? `，还剩下<span style="color:red;">${record_length - records.length}</span>个待显示` : ''}.....</div>
        <table class="common_table" style="margin-top:10px; margin-bottom:10px;">
            <tbody>
                <tr>
                    <th>账号</th>
                    <th>qq/wx/phone</th>
                    <th>旺旺/京东</th>
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
        // 团队
        let teamer_opts = '';
        Object.keys(TEAMERS).forEach(key => {
            teamer_opts += `<option value="${key}">${TEAMERS[key].text}</option>`;
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
                        <div style="margin-bottom:10px;"><input class="search_input phone" placeholder="会员账号" /></div>
                        <div><input class="search_input byqq" placeholder="会员qq" /></div>
                    </div>
                    <div style="margin-left:10px; margin-right:20px;">
                        <div style="margin-bottom:10px;"><input class="search_input qq" placeholder="qq号" /><button class="search_btn add">添加不同qq</button><button class="search_btn red del" style="margin-left:15px;">删除qq</button></div>
                        <div><input class="search_input note" placeholder="用户备注" /><button class="search_btn add-note">添加备注</button><button class="search_btn red del-note" style="margin-left:15px;">删除备注</button></div>
                    </div>
                    <div>
                        <div style="margin-bottom: 10px;"><input class="search_input j-gnote" placeholder="网页备注/真实姓名" /><button class="search_btn add-gnote">添加网页备注</button><button class="search_btn reb j-real-name-add-btn" style="margin-left:10px;">修改真实姓名</button></div>
                        <div><select class="search_input qq_exec_pre" style="width:auto;">${option_strs}</select><button class="search_btn add-record">添加做单记录</button><button class="search_btn reb j-del-data" style="margin-left:5px;">删除做单记录</button></div>    
                    </div>
                    <div style="margin-left:10px;">
                        <div><textarea style="height:61px;" class="search_input j-analysis-textarea"></textarea><button class="search_btn j-analysis-btn" style="vertical-align:top;width:40px;height:68px; margin-left:5px;">解析数据</button></div>
                    </div>
                </div>
                <div class="search m-search">
                        <input class="search_input j-contact-input" type="text" data-key="wx" placeholder="wx号" />
                        <button class="search_btn j-contact-add" data-key="wx" style="margin-left:10px">添加wx</button>
                        <button class="search_btn red j-contact-del" data-key="wx" style="margin-left:10px;">删除wx</button>
                        <button class="search_btn reb j-add-wxName-by-wx" style="margin-left:10px;">wx添加wx姓名</button>
                        <input class="search_input j-wxName" type="text" placeholder="wx名字(真实姓名)|wx姓名" style="margin-left:10px;width:165px;" />
                        <button class="search_btn j-wxName-add" style="margin-left:10px">添加wx姓名</button>
                        <button class="search_btn red j-wxName-del" style="margin-left:10px;">删除wx姓名</button>
                        <button class="search_btn j-nickname-add" style="margin-left:10px;">添加昵称</button>
                        <input class="search_input j-register-time" type="text" placeholder="注册时间" style="margin-left:10px; width:130px;" />
                        <button class="search_btn j-register-time-add-tang" style="margin-left:10px;">添加唐人注册时间</button> 
                </div>
                <div class="search m-search">
                    <input class="search_input j-mobile-input" type="text" placeholder="不同mobile" />
                    <button class="search_btn j-mobile-add" data-key="wx" style="margin-left:10px">添加mobile</button>
                    <button class="search_btn red j-mobile-del" data-key="wx" style="margin-left:10px;">删除mobile</button>
                    <input class="search_input j-ww-exec" placeholder="旺旺号" style="margin-left:10px;" />
                    <button class="search_btn j-ww-add" style="margin: 0 10px;">添加旺旺号</button><button class="search_btn red j-ww-del">删除旺旺号</button>
                    <button class="search_btn j-ww-add-back-second" style="margin-left:10px;">前面添加旺旺号</button>
                    <input class="search_input j-tang-id" type="text" placeholder="唐人id" style="margin-left:10px;width:80px;" />
                    <button class="search_btn j-tang-id-add" style="margin-left:10px;">添加唐人id</button>
                    <button class="search_btn reb j-wait-add" style="margin-left:10px;">添加待处理</button>
                </div>
                <div class="search m-search j-order-search">
                    查询订单是否被抓：<input class="search_input order-id" placeholder="查询订单号" style="width:140px;" /> <button class="search_btn order-search
                    " style="margin: 0 10px;">查询</button>
                    <textarea class="search_input j-modify-code-ipt" style="height:24px; margin-right:5px;"></textarea><button class="search_btn j-modify-code-btn-get">获取源码</button>
                    <button class="search_btn reb j-modify-code-btn" style="margin-left:10px;">修改源码</button>
                    <input class="search_input j-commission-ipt" type="text" placeholder="佣金" style="margin-left:10px; width:70px;" />
                    <button class="search_btn j-commission-add" style="margin-left:10px;">添加佣金比例</button>
                    <select class="search_input j-teamer-ipt" style="margin-left:10px; "><option value="">没有团队</option>${teamer_opts}</select>
                    <button class="search_btn reb j-teamer-add-btn" style="margin-left:10px;">添加团队</button>
                </div>
                <div class="search m-search">
                    <select class="search_input j-gender-ipt" style=""><option value="">未知</option><option value="1">男</option><option value="0">女</option></select>
                    <button class="search_btn reb j-gender-add-btn" style="margin-left:10px;">添加男女</button>
                    <input class="search_input j-ww-note-ipt" type="text" placeholder="旺旺备注" style="margin-left:10px;" />
                    <button class="search_btn j-ww-note-add" style="margin-left:10px;">添加旺旺备注</button>
                    <button class="search_btn j-jd-nickname-add" style="margin-left:10px;">添加京东昵称</button>
                    <input class="search_input j-jd-ipt" type="text" placeholder="京东号" style="margin-left:10px;" />
                    <button class="search_btn j-jd-add" style="margin-left:10px;">添加京东号</button>
                    <button class="search_btn j-jd-del" style="margin-left:10px; margin-right:5px;">删除京东号</button>
                    8：<input class="search_input j-filter-ipt" type="text" placeholder="筛选排出的产品" />
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
                    <div class="m-findData search">
                        <button class="search_btn j-almightySearch" style="">qq|phone|ww|wx全能搜索</button>
                        <button class="search_btn reb j-reg-search" style="margin-left:10px;">正则realname|ww搜索</button>
                        <button class="search_btn j-gatherQqs" style="">倒序筛选1238</button>
                        <button class="search_btn reb j-gatherRegisterQqs" style="">无损筛选1238</button>
                        <button class="search_btn j-gatherWx" style="">做单渠道号筛选1238</button>
                        <button class="search_btn j-gatherShopFilter" style="">店铺产品筛选12348</button>
                        <button class="search_btn j-gatherShop" style="">查询店铺做单数据346</button>
                        <button class="search_btn download" style="">下载数据</button>
                        <button class="search_btn reb j-wait-search" style="">筛选待处理（<span>0</span>）</button>
                    </div>
                    <div class="m-findData search" style="margin-top:0px;">
                        <span class="gray">1：</span><select class="search_input j-screen"><option value="1">筛选被抓</option><option value="0" selected>不筛选被抓</option></select>
                        <span class="gray">2：</span><select class="search_input j-screen-time"><option value="1" selected>筛选正序</option><option value="-1">筛选逆序</option></select>
                        <span class="gray">3：</span><input class="search_input j-search-time" placeholder="搜索时间" value="2023-04-01" type="date" />
                        <span class="gray">4：</span><select class="search_input j-comment-sel"><option value="" selected>未知评价</option><option value="1">已评价</option><option value="0">未评价</option><option value="-1">默认评价</option></select>
                        <span class="gray">5：</span><select class="search_input j-pig-type">${ORDERTYPES.map(type => `<option value="${type}">${type}</option>`)}</select>
                        <span class="gray">6：</span><select class="search_input j-shop-id"></select>
                        <span class="gray">7：</span><select class="search_input j-come-type">${COMETYPE.map(type => `<option value="${type.value}" ${type.value == 'pig' ? 'selected' : ''}>${type.name}</option>`).join('')}</select>
                        <button class="search_btn reb j-come-type-search" style="">查询渠道做单7</button>
                        <button class="search_btn reb j-modifyLastRecord" style="">修改最后一个记录67</button>
                    </div>
                    <div class="u-con">
                        <!-- <table class="common_table">
                            <tbody>
                                <tr>
                                    <th>账号</th>
                                    <th>全部qq号</th>
                                    <th>已做单数量</th>
                                    <th>备注</th>
                                    <th>最近做单日期</th>
                                    <th>最近做单渠道号</th>
                                </tr>
                                <tr>
                                    <td>
                                        <p>18711111111</p>
                                        <p>有多个账号</p>
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
                    <div style="margin-top:15px;" class="j-datas-add">
                        <textarea placeholder="复制进下载的数据" class="search_input" style="height:24px;"></textarea><button class="search_btn reb" style="margin-left:10px;vertical-align:bottom;">储存</button>
                    </div>
                </div>
            </div>
        `;
        document.querySelector('.release_tab').before(qqAdd);
        const $phone = qqAdd.querySelector('.phone');
        const $byQQ = qqAdd.querySelector('.byqq');
        const $ww = qqAdd.querySelector('.j-ww-exec');
        const $pigType = qqAdd.querySelector('.j-pig-type');
        const $shopId = qqAdd.querySelector('.j-shop-id');
        const $comeType = qqAdd.querySelector('.j-come-type');
        const $qqExecPre = qqAdd.querySelector('.qq_exec_pre');
        const $searchTime = qqAdd.querySelector('.j-search-time');
        const $gNote = qqAdd.querySelector('.j-gnote');
        const $wx = qqAdd.querySelector('.j-contact-input[data-key="wx"]');
        const $wxName = qqAdd.querySelector('.j-wxName');
        const $modifyCodeIpt = qqAdd.querySelector('.j-modify-code-ipt');
        const $registerTime = qqAdd.querySelector('.j-register-time');
        const $tangIdIpt = qqAdd.querySelector('.j-tang-id');
        const $analysisTextarea = qqAdd.querySelector('.j-analysis-textarea');
        const $mobileIpt = qqAdd.querySelector('.j-mobile-input');
        const $commissionIpt = qqAdd.querySelector('.j-commission-ipt');
        const $teamerIpt = qqAdd.querySelector('.j-teamer-ipt');
        const $genderIpt = qqAdd.querySelector('.j-gender-ipt');
        const $wwNoteIpt = qqAdd.querySelector('.j-ww-note-ipt');
        const $jdIpt = qqAdd.querySelector('.j-jd-ipt');
        // 下面是储存json
        const $datasAddDiv = document.querySelector('.j-datas-add');
        const $datasText = $datasAddDiv.querySelector('textarea');
        const $datasBtn = $datasAddDiv.querySelector('button');
        function isJSON(obj) {
            const str = JSON.stringify(obj);
            try {
                return JSON.parse(str) && str.length > 0;
            } catch (e) {
                return false;
            }
        }
        const cshLocal = (obj) => {
            Object.keys(obj).forEach(key => {
                if(['completeOrders'].includes(key)){
                    customStorage.setItem(key, obj[key]);
                }else{
                    localStorage.setItem(key, JSON.stringify(obj[key]));
                }
            })
        }
        $datasBtn.addEventListener('click', () => {
            const text = $datasText.value;
            if (!text) return alert('数据不存在！');
            try {
                if (!isJSON(text)) return alert('数据必须是json对象')
                const datas = JSON.parse(text);
                cshLocal(datas);
                alert('储存成功')
            } catch (error) {
                console.log(error);
                alert(error.message);
            }
        }, false)
        // $pigType变动的话
        $pigType.addEventListener('change', e => {
            const pig_type = $pigType.value;
            $shopId.innerHTML = LABELS.getShopOptionsHtml(pig_type);
        }, false)
        $pigType.dispatchEvent(new Event('change'));
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
        // 把input textarea select恢复初始值
        function restoreInitialValue(arrCss) {
            const elements = Array.from(document.querySelectorAll('.search_input')).filter(element => !arrCss.some(css => element.matches(css)));
            elements.forEach(element => {
                if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT')) {
                    if (element.tagName === 'INPUT' && element.type === 'text') {
                        element.value = element.defaultValue;
                    } else if (element.tagName === 'TEXTAREA') {
                        element.textContent = element.defaultValue;
                    } else if (element.tagName === 'SELECT') {
                        for (let i = 0; i < element.options.length; i++) {
                            element.options[i].selected = element.options[i].defaultSelected;
                        }
                    }
                }
            });
            // bug修复
            // $pigType.dispatchEvent(new Event('change'));
        }
        // qq改变后填充phone和旺旺和wx和真实姓名
        $byQQ.addEventListener('input', Tools.throttle(e => {
            const qq = $byQQ.value;
            let phones = Tools.almightySearch([qq]);
            const come_type_default = Tools.findDefaultValueBySelect($comeType);
            const qq_exec_pre_default = Tools.findDefaultValueBySelect($qqExecPre);
            restoreInitialValue(['.byqq', '.j-filter-ipt', '.j-pig-type', '.j-shop-id']);
            if (phones.length == 0) {
                // $phone.value = '';
                // $ww.value = '';
                // $wx.value = '';
                // $gNote.value = '';
                // $jdIpt.value = '';
                // $comeType.value = come_type_default;
                // $qqExecPre.value = qq_exec_pre_default;
                // $mobileIpt.value = '';
                // $tangIdIpt.value = '';
                // $registerTime.value = '';
                // $modifyCodeIpt.value = '';
                return;
            }
            if (phones.length > 1) {
                // $ww.value = '';
                // $wx.value = '';
                // $gNote.value = '';
                // $jdIpt.value = '';
                // $comeType.value = come_type_default;
                // $qqExecPre.value = qq_exec_pre_default;
                // $mobileIpt.value = '';
                // $tangIdIpt.value = '';
                // $registerTime.value = '';
                // $modifyCodeIpt.value = '';
                // 判断是否有黑名单的出现
                const accounts = phones.filter(account => {
                    const datas = DATA[account];
                    if (JSON.stringify(datas).includes('黑名单') || JSON.stringify(datas).includes('拉黑')) {
                        return false;
                    }
                    return true;
                })
                if (accounts.length > 1) {
                    return $phone.value = '有多个账号';
                } else {
                    phones = accounts;
                }
            }
            const phone = phones[0];
            $phone.value = phone;
            const wws = Tools.findWwsByPhones([phone]);
            $ww.value = wws.join(',');
            Tools.dispatchEvent($ww,'input')
            $wx.value = Tools.findWxsByDatas(DATA[phone], false).join(',');
            $gNote.value = Tools.findRealNamesByDatas(DATA[phone]).join(',');
            $jdIpt.value = Tools.findJdsByDatas(DATA[phone]).map(a => a.jd).join(',');
            // $mobileIpt.value = '';
            // $registerTime.value = '';
            // $tangIdIpt.value = '';
            // $modifyCodeIpt.value = '';
            // $comeType.value = come_type_default;
            // $qqExecPre.value = qq_exec_pre_default;
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
            //         $ww.value = wwExecs.join(',');
            //     } else {
            //         $phone.value = '有多个账号';
            //     }
            // } else {
            //     $phone.value = '';
            // }

        }, 1000))
        // $byQQ.addEventListener('blur',e=>{
        //     // 触发全能搜索
        //     const event = new Event('click',{bubbles:true});
        //     qqAdd.querySelector('.j-almightySearch').dispatchEvent(event);
        // })
        // 旺旺号变化之后的反应
        $ww.addEventListener('input', Tools.throttle(e => {
            const wwExec = e.target.value;
            // console.log(wwExec)
            $wwNoteIpt.value = '';
            if (wwExec) {
                const code = $phone.value;
                if(!DATA[code])return;
                const ww_arr = wwExec.split(',');
                const ww = ww_arr[ww_arr.length-1];
                // console.log(ww);
                const datas = Tools.findDataBykeyVlueByDatas(DATA[code],{ww_exec:ww});
                if(datas.length==0)return;
                // console.log(datas);
                const note = datas[0].note;
                if(!note)return;
                $wwNoteIpt.value = note;
            }
        }, 1000), false)
        // 当点击手机后填充
        addEventListener(qqAdd, 'click', e => {
            const account = e.target.textContent;
            $phone.value = account;
            // 得到最后一个记录的come-type,qq_exec_pre
            const { come_type, qq_exec_pre } = Tools.findLastKeyValuesByDatas(DATA[account], ['come_type', 'qq_exec_pre']);
            if (come_type) $comeType.value = come_type;
            if (qq_exec_pre) $qqExecPre.value = qq_exec_pre;
            const wws = Tools.findWwsByPhones([account]);
            $ww.value = wws.join(',');
            const wxs = Tools.findWxsByDatas(DATA[account]);
            // console.log(wxs);
            $wx.value = wxs.join(',');
        }, '.j-phone')
        // 查询订单是否违规
        qqAdd.querySelector('.j-order-search .order-search').addEventListener('click', e => {
            const orderId = qqAdd.querySelector('.j-order-search .order-id').value;
            if (!orderId) return alert('orderId不能为空');
            const orderConArr = [];
            const ordersA = `1815460827279566990`.split(`
            `);
            if (ordersA.includes(orderId.trim())) {
                orderConArr.push('<span style="color:red;">查询到艾跃被抓;</span>')
            } else {
                orderConArr.push('没查询到;');
            }
            const ordersW = `1820969364988713274`.split(`
            `);
            if (ordersW.includes(orderId.trim())) {
                orderConArr.push('<span style="color:red;">查询到万阁被抓;</span>')
            } else {
                orderConArr.push('没查询到;');
            }
            const ordersG = `1851986533286061969`.split(`
            `);
            if (ordersG.includes(orderId.trim())) {
                orderConArr.push('<span style="color:red;">查询到广浴隆被抓;</span>')
            } else {
                orderConArr.push('没查询到;');
            }
            // orderCon.innerHTML = orderConArr.join(',');
            setCon(orderConArr);
        }, false)
        // 待处理
        addEventListener(qqAdd, 'click', e => {
            const account = $phone.value;
            const result = Tools.addWait(account);
            if (result) alert('添加待处理成功');
        }, '.j-wait-add')
        addEventListener(qqAdd, 'click', e => {
            const $waitDel = e.target;
            // console.log($waitDel);
            const account = $waitDel.getAttribute('data-account');
            // console.log(account);
            const result = Tools.delWait(account);
            if (result) {
                qqAdd.querySelector('.j-wait-search').click();
                getAccountByWait();
            }
        }, '.j-wait-del')
        addEventListener(qqAdd, 'click', e => {
            const $waitUpdate = e.target;
            // console.log($waitUpdate);
            const account = $waitUpdate.getAttribute('data-account');
            // console.log(account);
            const result = Tools.updateWait(account);
            if (result) {
                // console.log('update');
                qqAdd.querySelector('.j-wait-search').click();
                getAccountByWait();
            }
        }, '.j-wait-update')
        // 筛选待处理个数
        function getAccountByWait() {
            const accounts = Tools.findAccountsByWait();
            qqAdd.querySelector('.j-wait-search span').textContent = accounts.length;
            return accounts;
        }
        requestAnimationFrame(getAccountByWait);
        addEventListener(qqAdd, 'click', e => {
            // const datas = Tools.findAccountsByWait().map(account => DATA[account]);
            // // console.log(datas);
            // if (datas.length > 0) {
            //     let table = getDataTable(datas)
            //     setCon([table]);
            // } else {
            //     setCon(['没有找到列表'])
            // }
            setCon(Tools.displayAccounts(getAccountByWait(), undefined, false));
        }, '.j-wait-search')
        // 团队的添加
        addEventListener(qqAdd, 'click', e => {
            const teamer = $teamerIpt.value;
            const account = $phone.value;
            // console.log(teamer);
            const result = Tools.addTeamer(account, teamer);
            if (result) alert('团队添加成功');
        }, '.j-teamer-add-btn')
        // ww性别的添加
        addEventListener(qqAdd, 'click', e => {
            const wws = $ww.value.split(',');
            const ww = wws[wws.length - 1];
            const account = $phone.value;
            const gender = $genderIpt.value;
            // console.log(ww);
            const result = Tools.addGenderByAccount(account, ww, gender);
            if (result) alert('性别添加成功');
        }, '.j-gender-add-btn')
        // ww备注的添加
        addEventListener(qqAdd, 'click', e => {
            const wws = $ww.value.split(',');
            const ww = wws[wws.length - 1];
            const account = $phone.value;
            const note = $wwNoteIpt.value;
            // console.log(ww);
            const result = Tools.addWwNoteByAccount(account, ww, note);
            if (result) alert(`${ww}备注添加成功`);
        }, '.j-ww-note-add')
        // 添加佣金
        addEventListener(qqAdd, 'click', e => {
            const commission = $commissionIpt.value;
            const account = $phone.value;
            const result = Tools.addCommission(account, commission);
            if (result) alert('佣金添加成功');
        }, '.j-commission-add')
        // 添加京东
        addEventListener(qqAdd, 'click', e => {
            const ipt = $jdIpt.value;
            const account = $phone.value;
            const result = Tools.addJd(account, ipt);
            if (result) alert('京东添加成功');
        }, '.j-jd-add')
        // 删除京东
        addEventListener(qqAdd, 'click', e => {
            const ipt = $jdIpt.value;
            const account = $phone.value;
            const result = Tools.delJd(account, ipt);
            if (result) alert('京东删除成功');
        }, '.j-jd-del')
        // ww备注的添加
        addEventListener(qqAdd, 'click', e => {
            const jds = $jdIpt.value.split(',');
            const jd = jds[jds.length - 1];
            const account = $phone.value;
            const jd_nickname = $wwNoteIpt.value;
            const result = Tools.addJdNickname(account, jd, jd_nickname);
            if (result) alert(`${jd}昵称添加成功`);
        }, '.j-jd-nickname-add')
        // 添加唐人id
        addEventListener(qqAdd, 'click', e => {
            const tang_id = $tangIdIpt.value;
            const account = $phone.value;
            const result = Tools.addTangId(account, tang_id);
            if (result) alert('唐人id添加成功');
        }, '.j-tang-id-add')
        // 添加唐人注册时间
        addEventListener(qqAdd, 'click', e => {
            const tang_register_time = $registerTime.value;
            const account = $phone.value;
            const result = Tools.addTangRegisterTime(account, tang_register_time);
            if (result) alert('唐人注册时间添加成功');
        }, '.j-register-time-add-tang')
        // 添加手机号
        addEventListener(qqAdd, 'click', e => {
            const mobile = $mobileIpt.value;
            const account = $phone.value;
            const result = Tools.addMobile(account, mobile);
            if (result) alert('添加手机成功');
        }, '.j-mobile-add');
        addEventListener(qqAdd, 'click', e => {
            const mobile = $mobileIpt.value;
            const account = $phone.value;
            const result = Tools.delMobile(account, mobile);
            if (result) alert(`手机（${mobile}）删除成功`);
        }, '.j-mobile-del')
        // 添加旺旺号
        qqAdd.querySelector('.j-ww-add').addEventListener('click', e => {
            const wwId = $ww.value;
            const phone = $phone.value;
            const result = Tools.addWW(phone, wwId);
            if (result) alert('添加旺旺成功');
        }, false)
        // 删除旺旺号
        qqAdd.querySelector('.j-ww-del').addEventListener('click', e => {
            const wwId = $ww.value;
            const phone = $phone.value;
            const result = Tools.delWW(phone, wwId);
            if (result) alert(`旺旺号${wwId}删除成功`);
        }, false)
        // 添加倒数旺旺号
        qqAdd.querySelector('.j-ww-add-back-second').addEventListener('click', e => {
            const wwId = $ww.value;
            const phone = $phone.value;
            const result = Tools.addWWBackFirst(phone, wwId);
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
            const pig_register_time = $registerTime.value;
            const record = { pig_phone: phone, pig_over_time: new Date().toLocaleString(), qq_exec_pre: qq_exec_pre, shop_label, pig_type, come_type };
            if (pig_register_time) record.pig_register_time = pig_register_time;
            // if(wx)record.wx = wx;
            // if(qq)record.pig_qq = qq;
            // if(!wx && !qq)return alert('wx|qq最少填写一个联系方式');
            // if(['a847457846'].includes(qq_exec_pre) && !wx)return alert('wx必须填写')
            if (qq_exec_pre == 'tang') {
                record.record_qq = '';
                delete record.record_qq;
            } else if (qq_exec_pre == 'a847457846') {
                if (Tools.alertFuc({ wx })) return;
                if (wx.includes(',')) return alert('有多个微信');
                record.wx = wx;
            } else {
                if (Tools.alertFuc({ qq })) return;
                record.pig_qq = qq;
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
        qqAdd.querySelector('.j-del-data').addEventListener('click', e => {
            const pig_phone = $phone.value;
            const result = Tools.deleteData(pig_phone);
            if (result) alert('删除成功');
        }, false)
        // 解析数据
        addEventListener(qqAdd, 'click', e => {
            const text = $analysisTextarea.value;
            console.log(text);
            // 提取注册时间
            const regTime = text.match(/注册时间：(.+?\s.+)\s?/);
            if (regTime) $registerTime.value = regTime[1];
            // 提取真实姓名
            const real_name = text.match(/实名：(.+?)\s/);
            if (real_name) $gNote.value = real_name[1];
            // 提取手机号
            const mobile = text.match(/手机号：([0-9]+)/);
            if (mobile) $mobileIpt.value = mobile[1];
        }, '.j-analysis-btn')
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
        qqAdd.querySelector('.j-add-wxName-by-wx').addEventListener('click', e => {
            const pig_phone = $phone.value;
            const wx_name = $wxName.value;
            const wx = $wx.value;
            const result = Tools.addWxNameByWx(pig_phone, wx, wx_name);
            if (result) alert('添加wx名字成功');
        })
        // 添加昵称
        addEventListener(qqAdd, 'click', e => {
            const account = $phone.value;
            const nickname = $wxName.value;
            const result = Tools.addNickname(account, nickname);
            if (result) alert('添加昵称成功');
        }, '.j-nickname-add')
        // 设置显示内容 
        const $btns = qqAdd.querySelector('.btns');
        const $con = $btns.querySelector('.u-con');
        const getCon = (arr, len) => {
            let str = '';
            const datas = arr || Tools.getShortDatas(arr, len);
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
            const mobile = $btn.getAttribute('data-mobile');
            const datas = JSON.parse($btn.getAttribute('data-datas').replaceAll("'", '"'));
            $btn.textContent = '已去除';
            $btn.style.color = 'gray';
            const exec = DATA[phone][0].wx ? DATA[phone][0].wx : DATA[phone][0].pig_qq;
            copyToClipboard(exec ? exec : mobile);
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
            // 填写qq
            $byQQ.value = qq ? qq : phone;
            // 触发更新
            var event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            $byQQ.dispatchEvent(event);
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
            let text = $text.textContent;
            $text.style.cursor = 'pointer';
            $text.title = '点击复制';
            // 如果首位有（）去掉正则表达式
            if (text) {
                text = text.replace(/^[\(|\（](.*)[\)|\）]$/, '$1')
                let regex = /^(?:A97)?(.*?)(?:占位符)?$/;
                let match = text.match(regex);
                if (match && match[1]) {
                    text = match[1];
                }
            }
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
        function GatherQqs(cb = () => true, pig_type = 'TB', is_back_filter = false) {
            let endTime = new Date(new Date().getTime() - 20 * 24 * 60 * 60 * 1000);
            // let startTime = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
            let startTime = new Date($searchTime.value);
            const is_screen = qqAdd.querySelector('.j-screen').value;
            const screen_time = parseInt(qqAdd.querySelector('.j-screen-time').value, 10);
            const comment_sel = qqAdd.querySelector('.j-comment-sel').value;
            let DateRecords = [];
            const DatePhones = Object.keys(DATA);
            const getLastTypeData = (datas, pig_type) => {
                let result;
                for (let i = 0; i < datas.length; i++) {
                    const data = Tools.copyObj(datas[i]);
                    if (!data.pig_type) data.pig_type = 'TB';
                    //在这里先不筛选pig_type
                    if ((data.pig_type == pig_type || true) && data.pig_over_time) {
                        result = data;
                        break;
                    }
                }
                return result;
            }
            // 筛选符合的记录
            const filterDateRecord = (record) => {
                let datas = DATA[record.pig_phone];
                // 优化符合数据，关闭找不同账号
                const humanData = humanDatas(datas, undefined, undefined, false);
                const notes = humanData.notes.join('');
                const diffPhones = humanData.diffPhones;
                if (
                    (notes.indexOf('骗子') == -1)
                    && notes.indexOf('删订单') == -1
                    && (diffPhones.length == 0 || true)
                    && !RDATA.isExist(record.pig_phone, 'order_reminder')
                    && cb(humanData)
                ) {
                    if ((is_screen == '1' && (notes.indexOf('被抓') == -1 || notes.indexOf('已换号') != -1)) || is_screen == '0') {
                        // console.log(humanData);
                        const $filterIpt = document.querySelector('.j-filter-ipt');
                        const filterVal = $filterIpt.value;
                        if (filterVal) {
                            if (filterVal.split(',').some(element => JSON.stringify(datas).includes(element))) {
                                return false;
                            }
                            // if(datas[0] && datas[0].shop_label && filterVal.split(',').some(ele=>datas[0].shop_label.includes(ele))){
                            //     return false;
                            // }
                            // if(datas[1] && datas[1].shop_label && datas[1].pig_type != datas[0].pig_type && filterVal.split(',').some(ele=>datas[1].shop_label.includes(ele))){
                            //     return false;
                            // }
                        }
                        return true;
                    }
                }
                return false;
            }
            for (let phone of DatePhones) {
                const datas = DATA[phone];
                if (datas.length == 0) continue;
                let data = getLastTypeData(datas, pig_type);
                if (!is_back_filter) {
                    // 如果不是倒序
                    if (data && new Date(data.pig_over_time) > startTime && new Date(data.pig_over_time) < endTime) {
                        if (filterDateRecord(data)) DateRecords.push(Tools.copyObj(data))
                    }
                } else {
                    // 如果倒序
                    if (data && new Date(data.pig_over_time) <= startTime) {
                        // console.log(data);
                        if (filterDateRecord(data)) {
                            // console.log(Tools.copyObj(data));
                            // console.log('11111111')
                            DateRecords.push(Tools.copyObj(data))
                        }
                    }
                }
            }
            // console.log(DateRecords);

            // 排序
            DateRecords.sort((a, b) => {
                if (new Date(a.pig_over_time) > new Date(b.pig_over_time)) {
                    return is_back_filter ? -screen_time : screen_time;
                } else {
                    return is_back_filter ? screen_time : -screen_time;
                }
            })
            // console.log(DateRecords);
            const table = getDataTable(DateRecords.slice(0, is_back_filter ? 2 : 5).map(data => DATA[data.pig_phone]), [{ text: 'copy去除', className: 'j-remindPhone', type: 'order_reminder' }, { text: '不再提醒', className: 'j-no-remind' }], DateRecords.length);
            setCon([table]);
        }
        qqAdd.querySelector('.j-gatherQqs').addEventListener('click', () => {
            const pig_type = $pigType.value;
            GatherQqs(humanData => {
                // return humanData.record_num >= 2;
                return true;
            }, pig_type, true)
        }, false)
        qqAdd.querySelector('.j-gatherRegisterQqs').addEventListener('click', () => {
            const pig_type = $pigType.value;
            GatherQqs(humanData => {
                // 注册时间超过1个月 做单时间跟注册时间相隔1个月以上
                // return new Date(humanData.record_time) - 30 * 24 * 60 * 60 * 10000 > new Date(humanData.register_time);
                return true;
            }, pig_type)
        }, false)
        qqAdd.querySelector('.j-gatherWx').addEventListener('click', () => {
            const pig_type = $pigType.value;
            const qq_exec_pre = $qqExecPre.value;
            // console.log(qq_exec_pre);
            GatherQqs(humanData => {
                // 判断是否是wx
                // console.log(humanData);
                if(humanData.last_recode.qq_exec_pre==qq_exec_pre){
                    
                    return true;
                }
                return false;
            }, pig_type)
        }, false)
        qqAdd.querySelector('.j-gatherShopFilter').addEventListener('click', () => {
            const pig_type = $pigType.value;
            const shop_label = $shopId.value;
            if (!shop_label) return;
            const comment_sel = qqAdd.querySelector('.j-comment-sel').value;
            GatherQqs(humanData => {
                // console.log(humanData);
                const data = humanData.last_recode;
                if(data.shop_label==shop_label){
                    if(comment_sel === ''){
                        return true;
                    }else{
                        if(data.is_comment == comment_sel)return true;
                        if(comment_sel === '0' && !data.is_comment)return true;
                    }
                }
                return false;
            }, pig_type)
        }, false)
        // 通过店铺找到做单数据
        qqAdd.querySelector('.j-gatherShop').addEventListener('click', () => {
            const arr = [];
            const shop_label = $shopId.value;
            const comment_sel = qqAdd.querySelector('.j-comment-sel').value;
            const search_time = $searchTime.value;
            if (!shop_label) return;

            setCon(Tools.displayAccountByKeyValue([['shop_label', shop_label]], (data, i) => {
                if ((comment_sel === '' && !data.is_comment) || (comment_sel && comment_sel == data.is_comment)) {
                    if (!RDATA.isExist(data.pig_phone, 'comment_reminder') && new Date(data.pig_over_time) > new Date(search_time)) return true;
                }
            }, (data, i) => i == 0, (data1, data2) => {
                // 排序
                let str1 = data1[0].comment_time ? data1[0].comment_time : data1[0].pig_over_time;
                let str2 = data2[0].comment_time ? data2[0].comment_time : data2[0].pig_over_time;
                return new Date(str1) > new Date(str2);
            }));
        }, false)
        // function getComeTypeByTang() {
        //     const accounts = Tools.findAccountsBykeyValue([['qq_exec_pre', 'tang']], (data, i) => {
        //         // console.log(data);
        //         // 距离现在有20天
        //         const account = data.pig_phone;
        //         let endTime = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
        //         // console.log(account,!RDATA.isExist(account,'comment_reminder'),new Date(data.pig_over_time)<= endTime,data.pig_over_time)
        //         if (new Date(data.pig_over_time) <= endTime && !RDATA.isExist(account, 'comment_reminder')) return true;
        //     }, true, (data, i) => i == 0);
        //     qqAdd.querySelector('.j-come-type-search span').textContent = accounts.length;
        //     return accounts;
        // }
        // requestAnimationFrame(getComeTypeByTang);
        // 提醒唐人做单
        addEventListener(qqAdd, 'click', e => {
            const come_type = $comeType.value;
            setCon(Tools.displayAccounts(Tools.findAccountsBykeyValue([['come_type', come_type]]), undefined, undefined, true));
        }, '.j-come-type-search')
        // 标注已评跟默认评价按钮
        addEventListener($con, 'click', (e) => {
            const $btn = e.target;
            const $tr = $btn.closest('tr[data-account]');
            // const datas = JSON.parse($btn.getAttribute('data-datas').replaceAll("'", '"'));
            const account = $tr.getAttribute('data-account');
            const val = $btn.getAttribute('data-val');
            const pig_type = $btn.getAttribute('data-type');
            $btn.textContent = (val == '1' ? '已评价' : '已默认评价');
            $btn.style.color = 'gray';
            Tools.lastAddCommentByPhone(account, val, pig_type);
        }, '.j-addComment')
        // 提醒添加微信
        addEventListener($con, 'click', e => {
            const $btn = e.target;
            const $tr = $btn.closest('tr[data-account]');
            // const datas = JSON.parse($btn.getAttribute('data-datas').replaceAll("'", '"'));
            const account = $tr.getAttribute('data-account');
            const result = Tools.RemindAddWx(account, 1);
            $btn.textContent = (result ? '已提醒' : '提醒失败');
        }, '.j-RemindAddWx')
        // 修改最后一个做单记录
        addEventListener(qqAdd, 'click', e => {
            const phone = $phone.value;
            const shop_label = qqAdd.querySelector('.j-shop-id').value;
            const qq_exec_pre = $qqExecPre.value;
            const come_type = $comeType.value;
            const obj = { qq_exec_pre, come_type };
            if (shop_label) obj.shop_label = shop_label;
            if (Tools.alertFuc({ phone, qq_exec_pre, come_type })) return;
            Tools.modifyDataToLastRecord(phone, obj);
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
        // 全能搜索
        addEventListener(qqAdd, 'click', e => {
            const qq = $byQQ.value;
            const phone = $phone.value;
            const ww = $ww.value;
            const wx = $wx.value;
            const mobile = $mobileIpt.value;
            const jd = $jdIpt.value;
            const keywords = [qq, phone, ww, wx, jd].filter(keyword => keyword);
            if (keywords.length == 0) return alert('请填写关键字qq||phone|ww|wx|jd!');
            // console.log(keywords);
            // console.log(Tools.findPhonesByKeyword(qq));
            // return;
            const arr = Tools.almightySearch(keywords);
            if (arr.length == 0) {
                setCon([`没找到做单记录<span style="margin:15px;display:inline-block;width:auto;height:auto;" class="j-add-record-btn search"></span>`]);
                Tools.addRecordBtn(phone, qqAdd.querySelector('.j-add-record-btn'), undefined, qq, mobile);
                return;
            }
            setCon(Tools.displayAccounts(arr, true, undefined, undefined, arr.length, qq))
            // 判断是否有一个qq多个账号的情况存在
            // console.log(arr);
            // if (arr.length === 1) {
            //     // 单账号
            //     let datas = arr[0];
            //     let table = getDataTable([datas])
            //     setCon([table, getCon(datas, 3)]);
            //     // setCon(arr[0]);
            // } else {
            //     // 多账号
            //     let str = arr.reduce((a, data, index) => {
            //         return a + getCon(data) + (index <= arr.length - 2 ? '<div style="border-top:1px dashed #c2b7cd; margin: 10px 0;"></div>' : '');
            //     }, '');
            //     let table = getDataTable(arr);
            //     setCon([table + str]);
            // }
            // alert(JSON.stringify(arr));
        }, '.j-almightySearch')
        // 真实姓名搜索
        addEventListener(qqAdd, 'click', e => {
            const real_name = $gNote.value;
            const ww = $ww.value;
            const search_arr = [];
            function zhh(key, value) {
                const arr = [];
                if (value.includes(',')) {
                    value.split(',').forEach(val => {
                        arr.push([key, val]);
                    })
                } else {
                    arr.push([key, value]);
                }
                return arr;
            }
            const arr = Tools.findAccountsBykeyValue([...zhh('ww_exec', ww), ...zhh('real_name', real_name)], undefined, false);
            setCon(Tools.displayAccounts(arr, true, undefined, undefined, arr.length));
            // if (arr.length == 0) return setCon(['没找到做单记录']);
            // // 判断是否有一个qq多个账号的情况存在
            // // console.log(arr);
            // if (arr.length === 1) {
            //     // 单账号
            //     let datas = arr[0];
            //     let table = getDataTable([datas])
            //     setCon([table, getCon(datas, 3)]);
            //     // setCon(arr[0]);
            // } else {
            //     // 多账号
            //     let str = arr.reduce((a, data, index) => {
            //         return a + getCon(data) + (index <= arr.length - 2 ? '<div style="border-top:1px dashed #c2b7cd; margin: 10px 0;"></div>' : '');
            //     }, '');
            //     let table = getDataTable(arr);
            //     setCon([table + str]);
            // }
        }, '.j-reg-search')
        // 获取源码
        addEventListener(qqAdd, 'click', () => {
            const phone = $phone.value;
            if (Tools.alertFuc({ pig_phone: phone })) return;
            const data = DATA[phone];
            $modifyCodeIpt.value = JSON.stringify(data);
        }, '.j-modify-code-btn-get')
        addEventListener(qqAdd, 'click', () => {
            const phone = $phone.value;
            const code = $modifyCodeIpt.value;
            if (Tools.alertFuc({ phone, code })) return;
            try {
                const json = JSON.parse(code);
                if (confirm('确定修改吗？')) {
                    DATA[phone] = json;
                    storageData();
                    alert('修改成功')
                }
            } catch (error) {
                console.log(error);
                alert('json数据格式不对')
            }
        }, '.j-modify-code-btn')
    }
    AddQQDiv();

    //添加一个备注
    function addEventListener(el, eventName, eventHandler, selector) {
        if (selector) {
            const wrappedHandler = (e) => {
                if (!e.target) return;
                // console.log(e.target);
                const el = e.target.closest(selector);
                if (el) {
                    // console.log(el);
                    eventHandler.call(el, e);
                }
            };
            el.addEventListener(eventName, wrappedHandler);
            return wrappedHandler;
        } else {
            const wrappedHandler = (e) => {
                eventHandler.call(el, e);
            };
            el.addEventListener(eventName, wrappedHandler);
            return wrappedHandler;
        }
    }
    const AddNote = () => {
        const Div = document.createElement('div');
        Div.innerHTML = `
            <style>
                .m-note{
                    display:flex;
                    margin-top: 15px;
                    margin-bottom: -15px;
                    flex-wrap: wrap;
                }
                .m-note>div{
                    display:inline-block;
                    margin-right: 15px;
                    line-height:2;
                    background: #e1e0e0;
                    padding:0 0 0 15px;
                    margin-bottom: 15px;
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

    // 其他一些简单功能
    const OtherCode = () => {
        const OtherCodeDiv = document.createElement('div');
        OtherCodeDiv.innerHTML = `
            <style>

            </style>
            <div class="m-search">
                <input type="text" class="search_input j-trade-ipt" placeholder="输入生意参谋指数" />
            </div>
            <div class="u-con" style="margin-top:15px;font-size:14px;"></div>      
        `;
        document.querySelector('.release_tab').before(OtherCodeDiv);

        const $con = OtherCodeDiv.querySelector('.u-con');
        const setCon = (text) => {
            $con.innerHTML = text;
        }

        // 指数转换
        const tradeChange = (number, cb) => {
            const url = 'https://www.diantoushi.com/switch/v2/change';
            const data = {
                "categoryId": "",
                "changeType": "2",
                "indexTrans": "[{\"num\":1,\"tradeIndex\":\"" + number.replace(/,/g, '') + "\"}]"
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
        const $tradeIpt = document.querySelector('.j-trade-ipt');
        addEventListener(OtherCodeDiv, 'input', Tools.throttle(e => {
            const trade = $tradeIpt.value;
            tradeChange(trade, (s) => {
                setCon(`<p>指数转换：${s}</p>`)
            })
        }), '.j-trade-ipt')
    }
    OtherCode();
    // // 源码修改相关的脚本
    // const ModifyRecordCode = () => {
    //     const RecordCodeDiv = document.createElement('div');
    //     RecordCodeDiv.innerHTML = `
    //         <style>

    //         </style>
    //         <div class="m-search">
    //             <input type="text" class="search_input" /><button class="search_btn">修改源码</button>
    //         </div>      
    //     `;
    //     const $pigComment = RecordCodeDiv.querySelector('.j-pig-comment');
    //     document.querySelector('.release_tab').before(RecordCodeDiv);
    // }
    // ModifyRecordCode();

    window.PIG = {
        Download,
        Tools
    }
})();
