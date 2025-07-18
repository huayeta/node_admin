// https://api.doctorxiong.club/v1/fund?code=007423
// https://api.doctorxiong.club/v1/fund/detail?code=007423
// https://kouchao.github.io/TiantianFundApi/apis/ 所有api信息
// 更新的话先 cd E:\work\TiantianFundApi-main 然后npm run start

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
// customStorage.setItem('jijin.datas1', JSON.parse(localStorage.getItem('jijin.datas')));

// {code:...data}
let DATAS = {};
// {day:total_arr[0][0]|credit,sort:-1|1|0,type:债权组合,checked:1|0是否筛选购买的,name:筛选名字,note:筛选备注,emoji:keynote|shield,sale_time:SALETIME,position:持仓情况,lv:利率债小于等于,dtSly:定投收益率大于等于,ratePositiveDay:连续正收益率的天数大于等于,classify:基金分类}
let SORT = {};
// {code:{checked:1,type:code_type_arr[0]债权组合,sale_time:7|30卖出时间,note:备注,keynote:重点,shield:抗跌,heavy:重仓,buy_time:买入时间,credit:信用值,income:购买后平均收益率,limit:限额,Ftype:债权类型,Ftype_text:债权类型,investment:定投相关,is_ct:城投债,classify:分类}}
let CODES = {};
//  ['lastWeekGrowth', '周涨幅',day], ['lastMonthGrowth', '月涨幅',day], ['lastYearGrowth', '年涨幅']
let BONDS = {};
const total_arr = [['dayGrowth', '日涨幅'], , ['custom3DayGrowth', '最近3天涨幅'], ['customLastWeekGrowth', '最近周涨幅'], ['custom2LastWeekGrowth', '最近2周涨幅'], ['customLastMonthGrowth', '最近月涨幅'], ['lastThreeMonthsGrowth', '3月涨幅'], ['lastSixMonthsGrowth', '6月涨幅']];
const code_type_arr = ['利率债', '信用债', '利率债为主', '信用债为主', '股基利率债为主', '股基信用债为主', '海外债权', '黄金', '组合'];
const SALETIME = {
    7: '7天免',
    30: '30天免',
    60: '60天免',
    90: '90天免',
    180: '180天免',
    365: '365天免',
    730: '2年免'
};
const EMOJIS = {
    '❤️': {
        key: 'keynote',
        title: '重点基金'
    },
    '🛡️': {
        key: 'shield',
        title: '抗跌基金'
    },
    '🏋🏿': {
        key: 'heavy',
        title: '重仓基金'
    },
    '💸': {
        key: 'dingtou',
        title: '定投基金'
    }
}
const FTYPES = {
    '3': 'DQII',
    '1': '股基',
    '2': '债基',
}
const CLASSIFICATION = {
    '1': 'CPO通信',
    '2': '半导体',
    '3': '机器人',
    '4': '云计算',
    '5': '固态电池',
    '6': '创新药',
    '7': '军工',
    '8': '低空经济',
    '10': '大数据',
    '13': '游戏',
    '14': '北证50',
    '15': '科创芯片',
    '16': '人工智能',
    '17': '稀土',
    '18': '5G',
    '19': '计算机',
    '20': '银行',
    '21': '多元金融',
    '22': '光伏',
}
let Tools = {
    dispatchEvent: ($ele, type) => {
        const event = new Event(type, {
            bubbles: true,
            cancelable: true,
        });
        $ele.dispatchEvent(event);
    },
    isTradingTime: () => {
        // return true;
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // 判断是否为工作日（周一到周五）
        if (day >= 1 && day <= 5) {
            // 判断是否在 9:30 - 11:30 之间
            if ((hour === 9 && minute >= 30) || (hour > 9 && hour < 11) || (hour === 11 && minute < 30)) {
                return true;
            }
            // 判断是否在 13:00 - 15:00 之间
            if (hour >= 13 && hour < 15) {
                return true;
            }
        }
        return false;
    },
}
// 创建一个基金估值自动查询事件中心
class jjQuery extends EventTarget {
    constructor() {
        super();
        this.max = 30 * 60 * 1000;
        this.delay_time = 1000;
        this.codes = [];
        this.objCodes = {};
        // this.queryTime = localStorage.getItem('jijin.QueryTime') || 0;
        if (Tools.isTradingTime()) {
            this.start();
            // 距离上次查询时间大于60秒
            // if (new Date().getTime() - this.queryTime >= time || !this.queryTime) {
            //     setTimeout(this.startTimer.bind(this), 2000)
            //     localStorage.setItem('jijin.QueryTime', new Date().getTime());
            // } else {
            //     setTimeout(this.startTimer.bind(this), time - (new Date().getTime() - this.queryTime))
            // }
        }
    }
    start() {
        console.log('开始查询基金估值');
        setTimeout(this.startTimer.bind(this), 2000)
    }
    addCode(code, firstCode) {
        this.objCodes[code] = firstCode;
        if (this.codes.includes(code)) return;
        this.codes.push(code);
    }
    removeCodes() {
        this.codes = [];
    }
    async startTimer() {
        const length = this.codes.length;
        let bh = false;
        // 依次循环codes
        for (let [index, code] of Object.entries(this.codes)) {
            if (length != this.codes.length) {
                bh = true;
                break;
            }
            const query_date = Tools.getCustomCodes(this.objCodes[code], 'valuation.query_date');

            // 距离上次查询时间大于60秒
            if (new Date().getTime() - new Date(query_date).getTime() >= this.max || !query_date) {
                // console.log(code, query_date, new Date().getTime() - new Date(query_date).getTime() >= this.max, new Date().getTime() - new Date(query_date).getTime(), this.max)
                this.dispatchEvent(new CustomEvent('start', { detail: { length, index: parseInt(index, 10) } }));
                await this.fetch(code);
                await Tools.delayExecute(this.delay_time);
            }
        }
        this.dispatchEvent(new CustomEvent('end', { detail: { length } }));
        Tools.updateDatasTable();
        if (!bh) {
            await Tools.delayExecute(this.max);
        }
        await this.startTimer();
    }
    async fetch(code) {
        const res = await Tools.fetch('fundValuation', { code });
        // 去数字部分
        const valuation = parseFloat(res.valuation.replace("%", ""));
        let value = {
            valuation: valuation,
            date: res.date,
            code: code,
            query_date: Tools.getTime(),
        };
        // Tools.setCustomCodes(code, {
        //     valuation: value
        // });
        this.dispatchEvent(new CustomEvent('valuation', { detail: value }));
    }
}
const jjQueryCenter = new jjQuery();
jjQueryCenter.addEventListener('start', ({ detail: { index, length } }) => {
    // console.log(e);
    const $ele = document.querySelectorAll('.j-jjQuery-ele');
    [...$ele].forEach(ele => {
        ele.innerHTML = `正在查询 ${index + 1}/${length}`;
    })
})
jjQueryCenter.addEventListener('end', (e) => {
    const $ele = document.querySelectorAll('.j-jjQuery-ele');
    [...$ele].forEach(ele => {
        ele.innerHTML = `估值查询`;
    })
})
// jjQueryCenter.addCode('015968');
// jjQueryCenter.addCode('017811');
// jjQueryCenter.addEventListener('valuation', (e) => {
//     const code = e.detail.code;
//     const valuation = e.detail.valuation;
//     console.log(code, valuation,e); 
// })
Object.assign(Tools, {
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
    getTime: (format = 'yyyy/mm/dd hh:ii:ss', date = new Date().getTime()) => {
        date = new Date(date);
        let year = date.getFullYear();
        let month = ("0" + (date.getMonth() + 1)).slice(-2);
        let day = ("0" + date.getDate()).slice(-2);
        let hours = ("0" + date.getHours()).slice(-2);
        let minutes = ("0" + date.getMinutes()).slice(-2);
        let seconds = ("0" + date.getSeconds()).slice(-2);

        let formattedTime = format
            .replace(/[|Y|y]+/g, year)
            .replace(/[M|m]+/g, month)
            .replace(/[D|d]+/g, day)
            .replace(/[H|h]+/g, hours)
            .replace(/[I|i]+/g, minutes)
            .replace(/[S|s]+/g, seconds);

        return formattedTime;
        // return new Date().toLocaleString();
    },
    getNowDate: () => {
        return {
            start: Tools.getTime('yyyy-01-01'),
            now: Tools.getTime('yyyy-mm-dd'),
        }
    },
    // 计算包含的天数
    getIncludeDays: (startDateStr, endDateStr) => {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const timeStart = startDate.getTime();
        const timeEnd = endDate.getTime();

        const diffTime = Math.abs(timeEnd - timeStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 1;
        } else {
            return diffDays + 1;
        }
    },
    objectToQueryParams: (params) => {
        return Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    },
    convertNumber: (num) => {
        if (num === null || num === undefined || num === '') {
            return "输入为空";
        }
        if (isNaN(Number(num))) {
            return "输入不是有效的数字";
        }
        num = Number(num);
        const units = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
        let unitIndex = 0;
        let result = '';
        if (num < 10) {
            result = num + units[0];
        } else {
            while (num >= 10 && unitIndex < units.length - 1) {
                if (num % 10 === 0 && num < 10) {
                    break;
                }
                num = Math.round(num / 10);
                unitIndex++;
            }
            result = num.toFixed(0) + units[unitIndex];
        }
        return result;
    },
    isNumber: (str) => {
        const num = Number(str);
        return !isNaN(num);
    },
    isNumber1: (str) => {
        if (!str) return false;
        const num = parseFloat(str);
        if (!isNaN(num) && (num > 0 || num < 0)) {
            return true;
        }
        return false;
    },
    restoreInitialValue: ($ipts, arrCss = []) => {
        const elements = Array.from($ipts).filter(element => !arrCss.some(css => element.matches(css)));
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
    },
    // 延迟执行
    delayExecute: (time = 4000) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    },
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
    upDateIncome: (code) => {
        if (!CODES[code]) return;
        let { buy_time } = CODES[code];
        if (!CODES[code].hasOwnProperty('buy_time')) return;
        if (buy_time == '') {
            return Tools.setCustomCodes(code, { income_sort: '' });
        }
        buy_time = buy_time[0];
        // 计算购买后的收益率
        const { customNetWorkData } = DATAS[code];
        let income = 0;
        let index = 0;
        customNetWorkData.forEach(data => {
            if (new Date(buy_time) <= new Date(data['FSRQ'])) {
                income += (+data['JZZZL']);
                index++;
            }
        })
        // console.log(code,income,index)
        if (index > 0) income = (income / index).toFixed(3);
        Tools.setCustomCodes(code, { income, income_day: index });
        // 设置收入sort
        let codes = Object.values(DATAS).filter(data => (CODES[data.code] && CODES[data.code].checked == 1 && CODES[data.code].income));
        // console.log(Object.keys(CODES))
        codes = Tools.sortCodes(codes, 'income', -1);
        for (let key in codes) {
            const code = codes[key].code;
            // console.log(Number(key)+1);
            const income_sort = `<span style="${key < 5 ? 'color:deepskyblue;' : ''}">${Number(key) + 1}</span>/${CODES[code].income_day}/${codes.length}`;
            Tools.setCustomCodes(code, { income_sort });
        }
        // console.log(CODES[code])
    },
    setCustomCodes: (code, obj) => {
        if (Tools.alertFuc({ code, obj })) return false;
        if (!DATAS[code]) return alert('code不存在');
        if (!CODES[code]) CODES[code] = {};
        Object.assign(CODES[code], obj);
        // console.log(obj,CODES[code],obj);
        if (obj.hasOwnProperty('buy_time')) Tools.upDateIncome(code);
        if (obj.hasOwnProperty('checked') && obj.checked == 0) {
            Tools.setCustomCodes(code, {
                income: 0,
                income_day: 0,
                income_sort: '',
            })
        }
        customStorage.setItem('jijin.codes', CODES);
        // Tools.updateDatasTable();
    },
    getCustomCodes: (code, path) => {
        const keys = path.split('.');
        let current = CODES[code] || {};
        for (const key of keys) {
            if (!current || !Object.prototype.hasOwnProperty.call(current, key)) {
                return undefined;
            }
            current = current[key];
        }
        return current;
    },
    delCustomCodes: (code) => {
        delete CODES[code];
        customStorage.setItem('jijin.codes', CODES);
    },
    setCustomSort: (obj) => {
        if (Tools.alertFuc({ obj })) return false;
        Object.assign(SORT, obj);
        localStorage.setItem('jijin.sort', JSON.stringify(SORT));
        Tools.updateDatasTable();
    },
    // 1 升序 -1 降序
    setSort: ({ day, sort }) => {
        Tools.setCustomSort({ day, sort });
        // SORT = { day, sort };
        // localStorage.setItem('jijin.sort', JSON.stringify(SORT));
        // // console.log(SORT);
        // Tools.updateDatasTable();
    },
    sortCodes: (codes, day, sort) => {
        // console.log(codes, day, sort);
        codes.sort((a, b) => {
            let result = 0;
            if (day == 'income') {
                let aa = bb = (sort > 0 ? 1000 : 0);
                if (CODES[a.code] && CODES[a.code][day]) aa = CODES[a.code][day];
                if (CODES[b.code] && CODES[b.code][day]) bb = CODES[b.code][day];
                result = aa - bb;
            } else if (day == 'credit') {
                let aa = bb = (sort > 0 ? 0 : 10000);
                if (a.position && +a.position.xx > 0) aa = +a.position.xx;
                if (b.position && +b.position.xx > 0) bb = +b.position.xx;
                return sort > 0 ? (bb - aa) : (aa - bb);
            } else if (day == 'sumLastDp') {
                if (Array.isArray(a.customAdjacentData) && Array.isArray(b.customAdjacentData)) {
                    result = Number(a.customAdjacentData[0].sum) - Number(b.customAdjacentData[0].sum);
                }
            } else if (day == 'valuation') {
                let aa = bb = (sort > 0 ? 1000 : 0);
                if (CODES[a.code] && CODES[a.code].valuation && CODES[a.code].valuation.valuation) aa = CODES[a.code].valuation.valuation;
                if (CODES[b.code] && CODES[b.code].valuation && CODES[b.code].valuation.valuation) bb = CODES[b.code].valuation.valuation;
                result = aa - bb;
            } else {
                result = Number(a[day]) - Number(b[day]);
            }
            return sort == 1 ? result : -result;
        })
        // console.log(codes);
        return codes;
    },
    sortHtml: (day) => {
        let codes = Object.values(DATAS);
        codes = Tools.sortCodes(codes, day, -1);
        for (let key in codes) {
            const code = codes[key].code;
            // console.log(Number(key)+1);
            DATAS[code][`${day}_sort`] = `<span style="${key < 5 ? 'color:deepskyblue;' : ''}">${Number(key) + 1}</span>/${codes.length}`;
        }
    },
    // 是否是债基
    isDebt: (code) => {
        const data = DATAS[code];
        const { Ftype = '债权' } = data;
        // console.log(data);
        let is = 2;//债基
        if (Ftype.includes('固收')) {
            is = 2;//债基
        } else if (Ftype.includes('QDII') || Ftype.includes('指数型') || Ftype.includes('商品')) {
            // is = 3; //QDII
            is = 1;
        } else if (data.asset && (+data.asset.gp > 1 || +data.asset.jj > 0)) {
            // 股票占比大于10的
            is = 1;
        }
        return is;
    },
    // 获取工作日
    getWorkingDay: (date, symbol = '+') => {
        let nextDay = new Date(date);
        while (true) {
            const dayOfWeek = nextDay.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                return nextDay;
            }
            nextDay.setDate(nextDay.getDate() + (symbol == '+' ? 1 : -1));
        }
    },
    // 获取购买后最大的卖出时间
    isSale: (code) => {
        const data = DATAS[code];
        if (!data || !data.maxSaleTime || !CODES[code] || !CODES[code].buy_time) return [];
        let { buy_time } = CODES[code];
        // if (!Array.isArray(buy_time)) buy_time = [buy_time];
        const arr = [];
        const getSaleStr = (time, maxSaleTime) => {
            if (!time || !maxSaleTime) return {};
            let result = {};
            let today = new Date();
            let specificDate = new Date(time);
            // console.log(specificDate,Tools.getWorkingDay(specificDate));
            // 如果是15点后买的就推迟一天当购买时间
            if (specificDate.getHours() >= 15) {
                specificDate.setDate(specificDate.getDate() + 1)
                specificDate.setHours(12, 0, 0, 0);
            }
            // 获取真正的工作日购买时间15点前
            specificDate = Tools.getWorkingDay(specificDate);
            // 计算基金确认时间
            specificDate = Tools.getWorkingDay(specificDate.setDate(specificDate.getDate() + 1));
            // 未来算满基金购买日期
            specificDate.setDate(specificDate.getDate() + Number(maxSaleTime) - 1);
            specificDate.setHours(15, 0, 0, 0);
            // 往上获取到工作日
            specificDate = Tools.getWorkingDay(specificDate, '-');
            // 再往前走一天
            specificDate.setDate(specificDate.getDate() - 1);
            // 往上获取到工作日
            specificDate = Tools.getWorkingDay(specificDate, '-');
            // 如果当前时间大于specificDate就可以卖出
            if (new Date() > specificDate) {
                result = {
                    time: time,
                    str: `<span class="gray" title="${specificDate.toLocaleString()}">可以售出</span>`
                };
            } else {
                // today.setHours(15, 0, 0, 0);
                today.setDate(today.getDate() + 1);
                today.setHours(0, 0, 0, 0);
                specificDate.setHours(0, 0, 0, 0);
                let dayDiff = Math.floor((specificDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                specificDate.setHours(15, 0, 0, 0);
                if (dayDiff == 0) dayDiff = '明';
                if (dayDiff < 0) dayDiff = '今';
                result = {
                    time: time,
                    str: `<span class="red" title="${specificDate.toLocaleString()}">${dayDiff}天后15:00售出</span>`
                }
            }
            return result;
        }
        buy_time.forEach(time => {
            const obj = getSaleStr(time, data.maxSaleTime);
            if (obj && obj.str && !obj.str.includes('可以售出')) {
                let resultStr = '';
                for (let index = 0; index < data.saleTime.length; index++) {
                    const saleTime = data.saleTime[index];
                    if (time && saleTime.saleTime) {
                        const result = getSaleStr(time, saleTime.saleTime);
                        // console.log(result);
                        if (result.str && !result.str.includes('可以售出')) {
                            resultStr = { ...result, rate: saleTime.rate };
                            break;
                        }
                    }
                }
                obj.rate = resultStr;
            }
            arr.push(obj);
        })
        return arr;
    },
    // 计算最近30天的最大涨幅跌幅
    countConsecutivePositives: (arr, symbol = '+') => {
        if (!Array.isArray(arr)) return { count: 0, sum: 0 };
        arr = arr.slice(0, 30);
        // console.log(arr);
        let count = 0;
        let sum = 0;
        let consecutiveCount = 0;
        let consecutiveSum = 0;
        let max = 0;
        let num = 0;
        for (let i = 0; i < arr.length; i++) {
            // console.log(+arr[i].JZZZL,-1,+arr[i].JZZZL >= -1);
            if ((symbol == '+' && +arr[i].JZZZL >= -0.01) || (symbol == '-' && +arr[i].JZZZL <= 0)) {
                // console.log('111111')
                consecutiveCount++;
                consecutiveSum += (+arr[i].JZZZL);
                num++;
            } else {
                if ((symbol == '+' && consecutiveSum > sum) || (symbol == '-' && consecutiveSum < sum)) {
                    // console.log(consecutiveCount,consecutiveSum);
                    count = consecutiveCount;
                    sum = consecutiveSum;
                }
                consecutiveCount = 0;
                consecutiveSum = 0;
            }
            if (symbol == '+' && +arr[i].JZZZL > max) {
                max = arr[i].JZZZL;
            } else if (symbol == '-' && +arr[i].JZZZL < max) {
                max = arr[i].JZZZL;
            }
        }
        if ((symbol == '+' && consecutiveSum > sum) || (symbol == '-' && consecutiveSum < sum)) {
            // console.log(consecutiveCount,consecutiveSum);
            count = consecutiveCount;
            sum = consecutiveSum;
        }
        consecutiveCount = 0;
        consecutiveSum = 0;
        sum = sum.toFixed(2);
        // console.log({count,sum})
        return { count, sum, max, num };
    },
    updateDatasTable: () => {
        let codes = Object.values(DATAS);
        if (SORT.day && SORT.sort != 0) {
            codes = Tools.sortCodes(codes, SORT.day, SORT.sort);
        }
        jjQueryCenter.removeCodes();
        Tools.setTable(Tools.getTable(codes));
    },
    storageDatas: async () => {
        customStorage.setItem('jijin.datas', DATAS);
        localStorage.setItem('jijin.sort', JSON.stringify(SORT));
        customStorage.setItem('jijin.codes', CODES);
        localStorage.setItem('jijin.bonds', JSON.stringify(BONDS));
    },
    // code:基金代码，name:基金名称，dayGrowth：日涨幅，lastWeekGrowth：周涨幅，lastMonthGrowth：月涨幅，lastThreeMonthsGrowth：三月涨幅，lastSixMonthsGrowth：六月涨幅，lastYearGrowth：年涨幅，netWorthDate：净值更新日期，expectWorthDate：净值估算更新日期
    fetch: async (action_name, params = {}) => {
        // console.log(Tools.objectToQueryParams(params));
        const res = await fetch(`http://127.0.0.1:3000/${action_name}?${Tools.objectToQueryParams(params)}`);
        const datas = await res.json();
        return datas;
    },
    // 获得历史涨幅
    fundMNHisNetList: async (code, pageIndex = 1, pagesize = 2.5 * 30) => {
        const fundMNHisNetList = await Tools.fetch('fundMNHisNetList', { 'FCODE': code, 'pageIndex': pageIndex, 'pagesize': pagesize });
        return fundMNHisNetList.Datas;
    },
    getCode: async (code) => {
        // 获取基金名字
        // const { SHORTNAME: name, FTYPE: Ftype } = (await Tools.fetch('fundMNDetailInformation', { 'FCODE': code })).Datas;
        // 获取基金涨幅
        const { Datas, Expansion: { TIME: netWorthDate } } = await Tools.fetch('fundMNPeriodIncrease', { 'FCODE': code });
        const Data = { code, netWorthDate, update_time: Tools.getTime() };
        Datas.forEach(data => {
            switch (data.title) {
                case 'Z':
                    Data.lastWeekGrowth = data.syl;
                    break;
                case 'Y':
                    Data.lastMonthGrowth = data.syl;
                    break;
                case '3Y':
                    Data.lastThreeMonthsGrowth = data.syl;
                    break;
                case '6Y':
                    Data.lastSixMonthsGrowth = data.syl;
                    break;
                case '1N':
                    Data.lastYearGrowth = data.syl;
                    break;
                default:
                    break;
            }
        })
        // 获取基金历史涨幅
        const fundMNHisNetList = await Tools.fundMNHisNetList(code, 1, 8 * 30);
        // 最近3天涨幅
        let custom3DayGrowth = 0;
        let customLastWeekGrowth = 0;
        let custom2LastWeekGrowth = 0;
        let customLastMonthGrowth = 0;
        let dayGrowth = 0;// 最新日涨幅
        // 最近一年每月的涨跌变化
        const customMonthData = {};
        // 记录每个时段的涨跌变化
        const customAdjacentData = [];
        fundMNHisNetList.forEach((data, i) => {
            if (i == 0) dayGrowth = data.JZZZL;
            if (Tools.isNumber(data.JZZZL)) {
                // 0,1,2,3   i=3  4-2=2
                if (i < 3) {
                    custom3DayGrowth += (+data.JZZZL);
                }
                if (i < 5) {
                    customLastWeekGrowth += (+data.JZZZL);
                }
                if (i < 5 * 2) {
                    custom2LastWeekGrowth += (+data.JZZZL);
                }
                if (i < 5 * 4) {
                    customLastMonthGrowth += (+data.JZZZL);
                }
                // 获取年月字段
                const date = new Date(data.FSRQ);
                const year = date.getFullYear();
                let month = date.getMonth() + 1;
                month = month < 10 ? `0${month}` : month;
                const key = `${year}-${month}`;
                // 计算月涨幅
                if (!customMonthData[key]) {
                    customMonthData[key] = 0;
                }
                customMonthData[key] += (+data.JZZZL);
                if (i <= 3 * 30) {
                    // 记录每个时段的涨跌变化
                    const lastAdjacentObj = customAdjacentData[customAdjacentData.length - 1];
                    // 存在并正负相同就累加
                    // console.log(lastAdjacentObj);
                    if (lastAdjacentObj && (Math.sign(lastAdjacentObj.sum) === Math.sign(+data.JZZZL) || Math.sign(+data.JZZZL) == 0)) {
                        // console.log((lastAdjacentObj.sum + (+data.JZZZL)));
                        // lastAdjacentObj.sum = (+lastAdjacentObj.sum + (+data.JZZZL)).toFixed(2);
                        lastAdjacentObj.sum = (+lastAdjacentObj.sum + (+data.JZZZL));
                        // 取两位数并转换数字
                        lastAdjacentObj.sum = +(+lastAdjacentObj.sum).toFixed(2);
                        lastAdjacentObj.next = data.FSRQ;
                        lastAdjacentObj.days++;
                    } else {
                        customAdjacentData.push({
                            sum: +data.JZZZL,
                            start: data.FSRQ,
                            next: data.FSRQ,
                            days: 1,
                        })
                    }
                }
            }
        })
        Object.keys(customMonthData).forEach(key => {
            customMonthData[key] = customMonthData[key].toFixed(2);
        })
        // 留下来最近6个月的数据
        Data.dayGrowth = dayGrowth;
        Data.customNetWorkData = fundMNHisNetList.slice(0, 2.5 * 30);
        Data.custom3DayGrowth = (custom3DayGrowth).toFixed(2);
        Data.customLastWeekGrowth = (customLastWeekGrowth).toFixed(2);
        Data.custom2LastWeekGrowth = (custom2LastWeekGrowth).toFixed(2);
        Data.customLastMonthGrowth = (customLastMonthGrowth).toFixed(2);
        Data.customMonthData = customMonthData;
        Data.customAdjacentData = customAdjacentData;

        // 其他基本信息
        const { data: { FundACRateInfoV2Expansion: { ShortName: name, FType: Ftype }, rateInfo: { sh, MAXSG, CYCLE, SGZT }, uniqueInfo, fundRelateTheme } } = await Tools.fetch('jjxqy1_2', { 'fcode': code })
        // 相关主题
        Data.relateTheme = fundRelateTheme;
        // 名称和类型
        Data.name = name;
        Data.Ftype = Ftype;
        // console.log(Ftype);
        // 卖出时间
        if (CYCLE != '' || sh != '') {
            // const time = (CYCLE ? CYCLE : sh[sh.length - 1].time).match(/(\d+)(.+)/);
            // if (time) {
            //     if (time[0].includes('天')) Data.maxSaleTime = time[1];
            //     if (time[0].includes('月')) Data.maxSaleTime = time[1] * 30;
            //     if (time[0].includes('年')) Data.maxSaleTime = time[1] * 365;
            // }
            const getTime = (str) => {
                const time = str.match(/(\d+)\D*$/);
                let saleTime = '';
                if (time) {
                    if (time[0].includes('天')) saleTime = time[1];
                    if (time[0].includes('月')) saleTime = time[1] * 30;
                    if (time[0].includes('年')) saleTime = time[1] * 365;
                }
                return saleTime;
            }
            // CYCLE是一个字符串比如：2个月
            Data.saleTime = sh;
            if (Data.saleTime && Data.saleTime.length > 0) {
                for (let i = 0; i < Data.saleTime.length; i++) {
                    const item = Data.saleTime[i];
                    if (!item.time) continue;
                    // const time = item.time.match(/(\d+)\D*$/);
                    let saleTime = getTime(item.time);
                    // if (time) {
                    //     if (time[0].includes('天')) saleTime = time[1];
                    //     if (time[0].includes('月')) saleTime = time[1] * 30;
                    //     if (time[0].includes('年')) saleTime = time[1] * 365;
                    // }
                    Data.saleTime[i] = {
                        ...Data.saleTime[i],
                        saleTime: saleTime,
                    }
                }
                Data.maxSaleTime = CYCLE ? getTime(CYCLE) : Data.saleTime[Data.saleTime.length - 1].saleTime;
            }
        }
        // 特色数据
        Data.uniqueInfo = {}
        if (uniqueInfo && uniqueInfo.length > 0) {
            // 最大回撤
            Data.uniqueInfo.maxretra1 = uniqueInfo[0].MAXRETRA1;
            // 波动率
            Data.uniqueInfo.stddev1 = uniqueInfo[0].STDDEV1;
            // 夏普比率
            Data.uniqueInfo.sharp1 = uniqueInfo[0].SHARP1;
        }
        // 是否限额
        Data.maxBuy = MAXSG;
        // 是否可以申购
        Data.sgzt = SGZT;

        // 基金的持仓情况asset 持仓具体情况assetPosition 债权情况position
        const { asset, assetPosition, position } = await Tools.getAsset(code);
        Data.asset = asset;
        Data.assetPosition = assetPosition;
        Data.position = position;
        if (Data.name.includes('联接') && Data.assetPosition.etf && Data.assetPosition.etf.code) {
            const { asset, assetPosition, position } = await Tools.getAsset(Data.assetPosition.etf.code);
            Data.ljjj = {
                asset,
                assetPosition,
                position,
            };
        }
        // 债权组合
        Data.customType = Tools.getCustomType(Data);

        console.log(Data);
        Tools.setCode(Data);
        return Data;
    },
    getAsset: async (code) => {
        // 资产情况
        let asset = {};
        // 资产具体情况
        let assetPosition = {};
        // 债权情况
        let position = {};
        // 获取基金的持仓情况
        const { data: { fundBondInvestDistri = [], fundAssetAllocationByDate = {}, expansion, fundInverstPosition = {} } } = await Tools.fetch('jjxqy2', { 'fcode': code });
        if (fundAssetAllocationByDate && fundAssetAllocationByDate[expansion] && fundAssetAllocationByDate[expansion].length > 0) {
            const data = fundAssetAllocationByDate[expansion][0];
            asset = {
                jj: data.JJ,//基金
                gp: data.GP,//股票
                zq: data.ZQ,//债权
                xj: data.HB,//现金
                qt: data.QT,//其他
            }
        }
        if (fundInverstPosition) {
            assetPosition = {
                // 基金
                etf: {
                    code: fundInverstPosition.ETFCODE,
                    name: fundInverstPosition.ETFSHORTNAME,
                },
                // 股票
                fundStocks: fundInverstPosition.fundStocks,
                // 债权
                fundboods: fundInverstPosition.fundboods,
            }
            // 计算债权涨跌幅
            const fundDiff = await Tools.countDp(assetPosition.fundStocks, assetPosition.fundboods);
            Object.assign(assetPosition, fundDiff);
            // 获得债权的信息
            // const { fundboods } = assetPosition;
            // if (fundboods && fundboods.length > 0) {
            //     for (let bood of fundboods) {
            //         if (!BONDS[bood.ZQDM]) {
            //             asyncBonds.add(async () => {
            //                 const arr = await Tools.getBondInfo({ text: bood.ZQMC, code: bood.ZQDM });
            //                 if (arr && arr.length > 0) {
            //                     BONDS[bood.ZQDM] = arr;
            //                 }
            //             });
            //         }
            //     }
            // }
        }
        if (fundBondInvestDistri) {
            fundBondInvestDistri.forEach(data => {
                switch (data.BONDTYPENEW) {
                    case '1':
                        // 信用债
                        position.xx = data.PCTNV;
                        break;
                    case '2':
                        // 利率债
                        position.lv = data.PCTNV;
                        break;
                    case '3':
                        // 可转债
                        position.kzz = data.PCTNV;
                        break;
                    case '4':
                        // 其他
                        position.qt = data.PCTNV;
                        break;
                    default:
                        break;
                }
            })
        }
        return { asset, assetPosition, position };
    },
    getBondInfo: async ({ text, code }) => {
        // 债券信息
        if (BONDS[code]) return BONDS[code];
        const Pcuss = 'eyJ0eXAiOiJKV1QiLCJ0eXBlIjoiand0IiwiYWxnIjoiSFMyNTYifQ.eyJjcmVhdGVUaW1lIjoiMjAyNC0xMi0yMyAyMzo1MzozOS45OTUiLCJleHAiOjE3MzQ5NzAxMTksInVzZXJJZCI6IjIwMjQxMjA5MTEzOTMwXzE4NzAzNjIwMTk1IiwiZXhwaXJlZFRpbWUiOiIyMDI0LTEyLTI0IDAwOjA4OjM5Ljk5NSJ9.EblXpVmlPi0IwdMXmMNdu1CFA7-dL7kLvU1AtFN8Ibs';
        const { data, returncode, info } = await Tools.fetch('finchinaSearch', { 'Pcuss': Pcuss, text: text });
        if (returncode != '0') return alert(info);
        if (data.list.length == 0) return alert('未找到该债券信息');
        const arr = [];
        data.list[0].label.forEach(label => {
            arr.push(label.name);
        })
        BONDS[code] = arr;
        localStorage.setItem('jijin.bonds', JSON.stringify(BONDS));
        return arr;
    },
    getBondInfosByData: async (data) => {
        // 获得债权的信息
        const { fundboods } = data.assetPosition;
        if (fundboods && fundboods.length > 0) {
            for (let bood of fundboods) {
                if (!BONDS[bood.ZQDM]) {
                    const arr = await Tools.getBondInfo({ text: bood.ZQMC, code: bood.ZQDM });
                    if (arr && arr.length > 0) {
                        BONDS[bood.ZQDM] = arr;
                    }
                    // asyncBonds.add(async () => {

                    // });
                }
            }
        }
    },
    getBondInfosByDatas: async (datas, cb = () => { }) => {
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            const { fundboods } = data.assetPosition;
            let is = false;
            if (fundboods && fundboods.length > 0) {
                for (let bood of fundboods) {
                    if (!BONDS[bood.ZQDM]) {
                        is = true;
                    }
                }
            }
            if (is) {
                await Tools.delayExecute();
                await Tools.getBondInfosByData(data);
                cb(i + 1);
            } else {
                cb(i + 1);
            }
        }
    },
    upDateFundDiff: async (code) => {
        if (!code || !DATAS[code] || !DATAS[code].assetPosition) return;
        const Data = DATAS[code];
        const diff = await Tools.countDp(Data.assetPosition.fundStocks, Data.assetPosition.fundboods);
        Object.assign(Data.assetPosition, diff);
        Tools.storageDatas();
    },
    countDp: async (fundStocks, fundboods) => {
        // 计算出股票的涨跌
        const fundStocksDiff = {};
        if (fundStocks && fundStocks.length > 0) {
            const secids = [];
            fundStocks.forEach(fund => {
                secids.push(`${fund.NEWTEXCH}.${fund.GPDM}`);
            })
            const { data } = await Tools.fetch('ulist', { secids: secids.join(',') });
            if (data && data.diff && data.diff.length > 0) {
                data.diff.forEach(item => {
                    fundStocksDiff[item['f12']] = item;
                })
            }
        }
        // 计算股票的涨幅跟持仓
        let gprice = 0;
        let stockce = 0;
        fundStocks && fundStocks.forEach(data => {
            stockce += Number(data['JZBL']);
            if (fundStocksDiff[data.GPDM] && Tools.isNumber(fundStocksDiff[data.GPDM]['f2']) && Tools.isNumber(fundStocksDiff[data.GPDM]['f3'])) {
                gprice += ((Number(fundStocksDiff[data.GPDM]['f2']) * Number(fundStocksDiff[data.GPDM]['f3']) * Number(data['JZBL'])) / 10000)
            }
        })

        // 计算出债权的涨跌
        const fundboodsDiff = {};
        if (fundboods && fundboods.length > 0) {
            const secids = [];
            fundboods.forEach(fund => {
                secids.push(`${fund.NEWTEXCH}.${fund.ZQDM}`);
            })
            const { data } = await Tools.fetch('ulist', { secids: secids.join(',') });
            if (data && data.diff && data.diff.length > 0) {
                data.diff.forEach(item => {
                    fundboodsDiff[item['f12']] = item;
                })
            }
        }
        // 计算出债权的涨幅和持仓
        let price = 0;
        let boodce = 0;
        fundboods && fundboods.forEach(data => {
            boodce += Number(data['ZJZBL']);
            if (fundboodsDiff[data.ZQDM] && Tools.isNumber(fundboodsDiff[data.ZQDM]['f2']) && Tools.isNumber(fundboodsDiff[data.ZQDM]['f3'])) {
                price += ((Number(fundboodsDiff[data.ZQDM]['f2']) * Number(fundboodsDiff[data.ZQDM]['f3']) * Number(data['ZJZBL'])) / 10000)
            }
        })
        return {
            fundStocksDiff,
            fundStocksDp: {
                gprice: gprice.toFixed(4),
                stockce,
            },
            fundboodsDiff,
            fundboodsDp: {
                price: price.toFixed(4),
                boodce
            },
            updateTime: Tools.getTime()
        }
    },
    countInvestment: async (codes, each = () => { }) => {
        const $parent = document.querySelector('.j-fundDtCalculator').closest('div.m-search');
        const inputsAndSelects = $parent.querySelectorAll('input[name], select[name]');

        // 创建一个对象来存储值
        const values = {};

        // 遍历每个input和select元素，获取值和名称
        inputsAndSelects.forEach(element => {
            const name = element.getAttribute('name');
            const value = element.value;
            values[name] = value;
        });
        let index = 0;
        for (let code of codes) {
            // console.log(code);
            index++;
            let investment = {};
            for (let weekDtDay of [1, 2, 3, 4, 5]) {
                const result = await Tools.fetch('fundDtCalculator', { ...values, fcode: code, weekDtDay });
                if (result.errorCode == 0) {
                    let { fcode, ...strategy } = values;
                    investment[weekDtDay] = {
                        dtPeriods: result.data.dtPeriods,//定投总期数
                        dtSly: result.data.dtSly,//定投收益率%
                        finalTotalAssets: result.data.finalTotalAssets,//期末总资产
                        totalPrincipal: result.data.totalPrincipal,//投入总成本
                        totalSy: result.data.totalSy,//收入多少
                        strategy: strategy,//定投策略
                    }
                }
            }
            // console.log(result);
            each(investment, `${index}/${codes.length}`);
            Tools.setCustomCodes(code, { investment });
            Tools.updateDatasTable();
        }
    },
    // 删除定投
    delInvestment: (codes) => {
        codes.forEach(code => {

        })
    },
    getCustomType: (Data) => {
        // 基金组合
        let customType = '';
        if (Data.asset) {
            if (+Data.asset.gp > 0) customType += '股票';
            if (+Data.asset.jj > 0) customType += '基金';
            let arr = [];
            Object.keys(Data.position).forEach(position => {
                if (+Data.position[position] > 0) arr.push(position);
            })
            arr = arr.sort((a, b) => +Data.position[a] < +Data.position[b])
            switch (arr[0]) {
                case 'xx':
                    customType += '信用债';
                    break;
                case 'lv':
                    customType += '利率债';
                    break;
                case 'kzz':
                    customType += '可转债';
                    break;
                case 'qt':
                    customType += '其他';
                    break;
                default:
                    break;
            }
            if (arr.length > 1) customType += '为主';
            // console.log(customType)
        }
        return customType;
    },
    showYh: (fundboods) => {
        if (!fundboods && fundboods.length == 0) return '';
        let count = 0;
        fundboods.forEach(({ ZJZBL, ZQMC, BONDTYPE }) => {
            if ((ZQMC.includes('银行二级') || ZQMC.includes('银行永续') || ZQMC.includes('银行CD'))) {
                count += Number(ZJZBL);
            }
        })
        return count;
    },
    addCombinationCode: (codes) => {
        const combination = {
            code: [], name: [], Ftype: [], netWorthDate: [], dayGrowth: 0, customNetWorkData: [], customLastWeekGrowth: 0, custom2LastWeekGrowth: 0, customLastMonthGrowth: 0,
            lastWeekGrowth: 0, lastMonthGrowth: 0, lastThreeMonthsGrowth: 0, lastSixMonthsGrowth: 0, lastYearGrowth: 0,
        };
        const customNetWorkData = [];
        codes.forEach(code => {
            combination.code.push(code);
            combination.name.push(DATAS[code].name);
            combination.Ftype.push(DATAS[code].Ftype);
            // 净值更新日期
            combination.netWorthDate.push(DATAS[code].netWorthDate);
            // 日涨幅
            combination.dayGrowth += (+DATAS[code].dayGrowth);
            // 涨幅列表
            customNetWorkData.push(DATAS[code].customNetWorkData);
            // 自定义涨幅
            combination.customLastWeekGrowth += (+DATAS[code].customLastWeekGrowth);
            combination.custom2LastWeekGrowth += (+DATAS[code].custom2LastWeekGrowth);
            combination.customLastMonthGrowth += (+DATAS[code].customLastMonthGrowth);
            // 其他涨幅
            combination.lastWeekGrowth += (+DATAS[code].lastWeekGrowth);
            combination.lastMonthGrowth += (+DATAS[code].lastMonthGrowth);
            combination.lastThreeMonthsGrowth += (+DATAS[code].lastThreeMonthsGrowth);
            combination.lastSixMonthsGrowth += (+DATAS[code].lastSixMonthsGrowth);
            combination.lastYearGrowth += (+DATAS[code].lastYearGrowth);
        })
        combination.dayGrowth = (combination.dayGrowth / codes.length).toFixed(2);
        combination.customLastWeekGrowth = (combination.customLastWeekGrowth / codes.length).toFixed(2);
        combination.custom2LastWeekGrowth = (combination.custom2LastWeekGrowth / codes.length).toFixed(2);
        combination.customLastMonthGrowth = (combination.customLastMonthGrowth / codes.length).toFixed(2);
        combination.lastWeekGrowth = (combination.lastWeekGrowth / codes.length).toFixed(2);
        combination.lastMonthGrowth = (combination.lastMonthGrowth / codes.length).toFixed(2);
        combination.lastThreeMonthsGrowth = (combination.lastThreeMonthsGrowth / codes.length).toFixed(2);
        combination.lastSixMonthsGrowth = (combination.lastSixMonthsGrowth / codes.length).toFixed(2);
        combination.lastYearGrowth = (combination.lastYearGrowth / codes.length).toFixed(2);

        // combination.dayGrowth = (combination.dayGrowth).toFixed(2);
        // combination.customLastWeekGrowth = combination.customLastWeekGrowth.toFixed(2);
        // combination.custom2LastWeekGrowth = (combination.custom2LastWeekGrowth).toFixed(2);
        // combination.customLastMonthGrowth = (combination.customLastMonthGrowth).toFixed(2);
        // combination.lastWeekGrowth = (combination.lastWeekGrowth).toFixed(2);
        // combination.lastMonthGrowth = (combination.lastMonthGrowth).toFixed(2);
        // combination.lastThreeMonthsGrowth = (combination.lastThreeMonthsGrowth).toFixed(2);
        // combination.lastSixMonthsGrowth = (combination.lastSixMonthsGrowth).toFixed(2);
        // combination.lastYearGrowth = (combination.lastYearGrowth).toFixed(2);

        combination.code = combination.code.join(',');
        // 涨幅列表
        customNetWorkData[0].forEach((ssssss, key) => {
            let JZZZL = 0;
            for (let i = 0; i < customNetWorkData.length; i++) {
                JZZZL += (+(customNetWorkData[i][key] ? customNetWorkData[i][key].JZZZL : 0));
            }
            const FSRQ = customNetWorkData[0][key].FSRQ;
            combination.customNetWorkData.push({ JZZZL: (JZZZL / codes.length).toFixed(2), FSRQ })

            // combination.customNetWorkData.push({ JZZZL: (JZZZL).toFixed(2), FSRQ })
        })
        Tools.setCode(combination);
        // console.log(combination);

    },
    updatasCodes: async ($btn, codes) => {
        if ($btn.ing != undefined) return;
        $btn.ing = 1;
        const maxLength = codes.length;
        let arr = [];
        for (let code of codes) {
            // console.log(code);
            $btn.innerHTML = `正在更新${$btn.ing - 0}/${maxLength}`;
            const datas = DATAS[code];
            if (!code.includes(',') && `${new Date(datas.netWorthDate).getMonth()}-${new Date(datas.netWorthDate).getDate()}` != `${new Date().getMonth()}-${new Date().getDate()}`) {
                // console.log(code);
                // 一次性更新5个
                // if (arr.length < 5) {
                //     arr.push(Tools.getCode(code));
                // } else {
                //     await Promise.all(arr);
                //     arr = [];
                // }
                await Tools.getCode(code);
            }
            $btn.ing++;
        }
        if (arr.length > 0) {
            await Promise.all(arr);
            arr = [];
        }
        $btn.ing = undefined;
        $btn.innerHTML = '更新债权';
        Tools.updateDatasTable();
        alert('更新成功');
    },
    delCode: (code) => {
        delete DATAS[code];
        // 排行
        total_arr.forEach(total => {
            Tools.sortHtml(total[0]);
        })
        Tools.delCustomCodes(code);
        Tools.storageDatas();
        Tools.updateDatasTable();
    },
    addBuyTime: (code, time) => {
        if (!code || !DATAS[code]) return alert('code不对')
        //设置买入时间
        time = time || Tools.getTime();
        // console.log(time,code)
        if (!CODES[code]) CODES[code] = {};
        let buy_time = CODES[code]['buy_time'];
        if (buy_time == undefined) {
            buy_time = [time];
        } else {
            // if (!Array.isArray(buy_time)) buy_time = [buy_time];
            buy_time = [...buy_time, time];
        }
        // 排序数组(buy_time);
        buy_time.sort((a, b) => {
            return new Date(a) - new Date(b);
        })
        Tools.setCustomCodes(code, { buy_time });
    },
    delBuyTime: (code, index) => {
        // console.log(index)
        // 删除index索引的值
        const buy_time = CODES[code]['buy_time'];
        buy_time.splice(index, 1);
        // console.log(buy_time);
        Tools.setCustomCodes(code, { buy_time });
    },
    setCode: (datas) => {
        DATAS[datas.code] = datas;
        // 排行
        total_arr.forEach(total => {
            Tools.sortHtml(total[0]);
        })
        Tools.upDateIncome(datas.code);
        // Tools.delCustomCodes(datas.code);
        Tools.storageDatas();
        Tools.updateDatasTable();
    },
    getSelCodes: () => {
        const $trs = $table.querySelectorAll('tr.select');
        const codes = [];
        $trs.forEach($tr => {
            const code = $tr.getAttribute('data-code');
            if (code) codes.push(code);
        })
        return codes;
    },
    getNowCodes: () => {
        const $trs = $table.querySelectorAll('tr');
        const codes = [];
        $trs.forEach($tr => {
            const code = $tr.getAttribute('data-code');
            if (code) codes.push(code);
        })
        return codes;
    },
    // 列表全选
    selectAllTrs: () => {
        const $trs = $table.querySelectorAll('tr');
        $trs.forEach($tr => {
            $tr.classList.add('select');
        })
    },
    // addCode: async (code) => {
    //     // console.log(code);
    //     const res = await Tools.fetch(code);
    //     if (res.code == '200') {
    //         const { netWorthData } = res.data;
    //         const maxLength = netWorthData.length;
    //         let customLastWeekGrowth = 0;
    //         let custom2LastWeekGrowth = 0;
    //         let customLastMonthGrowth = 0;
    //         // 0,1,2,3   i=3  4-2=2  
    //         for (let i = maxLength - 1; i > 0; i--) {
    //             if (i >= maxLength - 5) {
    //                 customLastWeekGrowth += (+netWorthData[i][2]);
    //             }
    //             if (i >= maxLength - 5 * 2) {
    //                 custom2LastWeekGrowth += (+netWorthData[i][2]);
    //             }
    //             if (i >= maxLength - 5 * 4) {
    //                 customLastMonthGrowth += (+netWorthData[i][2]);
    //             }
    //         }
    //         // 留下来最近6个月的数据
    //         res.data.customNetWorkData = netWorthData.slice(-6 * 30);
    //         res.data.customLastWeekGrowth = (customLastWeekGrowth).toFixed(2);
    //         res.data.custom2LastWeekGrowth = (custom2LastWeekGrowth).toFixed(2);
    //         res.data.customLastMonthGrowth = (customLastMonthGrowth).toFixed(2);
    //         delete res.data.totalNetWorthData;
    //         delete res.data.netWorthData;
    //         Tools.setCode(res.data);
    //         return res.data;
    //     }
    //     return false;
    // },
    getTable: (datas = []) => {
        let str = '';
        let increment = -1;
        datas.forEach((data, index) => {
            // console.log(data)
            // 判断是否更新
            let is_new = false;
            if (new Date().getDate() == new Date(data.netWorthDate).getDate()) {
                is_new = true;
            }
            // 定投收益率
            let dtSly = 0;
            if (CODES[data.code] && CODES[data.code].investment) {
                dtSly = (Object.keys(CODES[data.code].investment).map(week => {
                    return `${(+CODES[data.code].investment[week].dtSly)}`;
                }).reduce((acc, num) => (+acc) + (+num), 0) / 5).toFixed(2);
            }
            // 判断搜索的name是否存在
            let is_filter_name = true;
            {
                if (!SORT.name) {
                    is_filter_name = true;
                } else {
                    let arr = SORT.name.split(',');
                    is_filter_name = arr.some(str => (data.name.includes(str) || data.code.includes(str)));
                }
            }
            // 判断资产是涨还是跌
            let assetDp = 0;
            if (data.assetPosition && data.assetPosition.fundStocksDp && +data.assetPosition.fundStocksDp.gprice != 0) {
                assetDp = +data.assetPosition.fundStocksDp.gprice
            } else if (data.ljjj && data.ljjj.assetPosition && data.ljjj.assetPosition.fundStocksDp) {
                assetDp = +data.ljjj.assetPosition.fundStocksDp.gprice
            }
            // 连续正天数数据
            const count_pos = Tools.countConsecutivePositives(data.customNetWorkData, '+');
            // 连续负天数数据
            const count_neg = Tools.countConsecutivePositives(data.customNetWorkData, '-');
            // 判断是否有城投
            let is_ct;
            {
                if (data.assetPosition && data.assetPosition.fundboods && data.assetPosition.fundboods.length > 0) {
                    const fundboods = data.assetPosition.fundboods;
                    // 遍历fundboods
                    fundboods.forEach(fundbood => {
                        if (BONDS[fundbood.ZQDM] && BONDS[fundbood.ZQDM].includes('城投债')) {
                            is_ct = '1';
                        }
                    })
                }
            }
            // 判断是否限购
            let is_limited = false;
            if (data.maxBuy && +data.maxBuy <= 100000) {
                is_limited = true;
            }
            // 判断是否有筛选
            // 债券组合筛选
            if ((!SORT.type || (data.customType && data.customType.includes(SORT.type)))) {
                // 债权类型筛选
                if (!SORT.Ftype_text || (SORT.Ftype_text && data.Ftype && data.Ftype.includes(SORT.Ftype_text))) {
                    // 基金代码选中筛选
                    if (!SORT.checked || (SORT.checked == 1 && CODES[data.code] && CODES[data.code].checked == 1)) {
                        // name筛选/code筛选
                        if (is_filter_name) {
                            // note筛选
                            if (!SORT.note || (CODES[data.code] && CODES[data.code].note && CODES[data.code].note.includes(SORT.note))) {
                                // position持仓筛选
                                if (!SORT.position || (data.position && +data.position[SORT.position] > 0)) {
                                    // emoji筛选
                                    if (!SORT.emoji || (CODES[data.code] && CODES[data.code][EMOJIS[SORT.emoji].key] == 1)) {
                                        // 针对卖出时间筛选
                                        if (!SORT.sale_time || (data.maxSaleTime == SORT.sale_time)) {
                                            // 针对是否是债基筛选
                                            if (!SORT.Ftype || SORT.Ftype == Tools.isDebt(data.code)) {
                                                // 筛选利率债<=
                                                if (!SORT.lv || (data.position && (!data.position.lv || +data.position.lv <= +SORT.lv))) {
                                                    // 筛选定投收益率>=
                                                    if (!SORT.dtSly || (CODES[data.code] && CODES[data.code].investment && dtSly >= (+SORT.dtSly))) {
                                                        // 连续正天数筛选
                                                        if (!SORT.ratePositiveDay || count_pos.count >= SORT.ratePositiveDay) {
                                                            // 筛选连续负天数筛选
                                                            if (!SORT.rateNegativeDay || count_neg.count >= SORT.rateNegativeDay)
                                                                // 是否是城投筛选
                                                                if (!SORT.is_ct || (SORT.is_ct == '1' && is_ct == '1')) {
                                                                    // 是否有基金分类筛选
                                                                    if (!SORT.classify || (CODES[data.code] && CODES[data.code].classify && SORT.classify == CODES[data.code].classify)) {
                                                                        increment++;
                                                                        str += `
                                                                            <tr data-code="${data.code}" style="${data.code.includes(',') ? 'background: #fff7f3;' : ''}">
                                                                                <td>
                                                                                    ${index + 1}.<input type="checkbox" class="j-code-checkbox" ${(CODES[data.code] && CODES[data.code].checked == 1) ? 'checked' : ''} /><span class="j-code">${data.code.includes(',') ? data.code.replaceAll(',', '<br />') : data.code}</span>
                                                                                    <p class="fs12 gray" style="text-indent:2em;">+${count_pos.count},+${count_pos.sum}（${count_pos.num}/${count_pos.max}）</p>
                                                                                    <p class="fs12 gray" style="text-indent:2em;">-${count_neg.count},${count_neg.sum}（${count_neg.num}/${count_neg.max}）</p>
                                                                                </td>
                                                                                <td>
                                                                                    <span class="j-code-name ${(is_limited || (data.sgzt && data.sgzt.includes('暂停'))) ? 'del' : ''}" style="white-space:initial; " title="限购：${Tools.convertNumber(data.maxBuy)}">${data.name}${(is_limited || +data.maxBuy < 1000000) ? `<span class="gray fs12">/${data.maxBuy}</span>` : ''}${(data.sgzt && data.sgzt.includes('暂停')) ? `/${data.sgzt}` : ''}</span>
                                                                                    ${is_new ? '<span title="已经更新">🔥</span>' : ''}
                                                                                    ${CODES[data.code] && Object.keys(EMOJIS).map(emoji => {
                                                                            return CODES[data.code][EMOJIS[emoji].key] == 1 ? `<span class="j-code-emoji-del" data-emoji="${emoji}" style="" title="${EMOJIS[emoji].title}">${emoji}</span>` : '';
                                                                        }).join('') || ''}
                                                                                    <p class="j-copyText fs12 green">${CODES[data.code] && CODES[data.code].note ? CODES[data.code].note : ''}</p>
                                                                                    ${(Array.isArray(data.relateTheme) || (CODES[data.code] && CODES[data.code].classify)) ? `<p class="wsi">` : ''}
                                                                                    ${(CODES[data.code] && CODES[data.code].classify) ? `<span class="u-box-1 mr5 j-classify" style="color:green;">${CLASSIFICATION[CODES[data.code].classify]}</span>` : ''}
                                                                                    ${Array.isArray(data.relateTheme) && `${data.relateTheme.map((theme, index) => `<span class="u-box-1" style="${index !== 0 && 'margin-left:5px;' || ''}">${theme.SEC_NAME}</span>`).join('')}` || ''}
                                                                                    ${(Array.isArray(data.relateTheme) || (CODES[data.code] && CODES[data.code].classify)) ? `</p>` : ''}
                                                                                </td>
                                                                                <td>${(CODES[data.code] && CODES[data.code].income) ? `<span class="${+CODES[data.code].income > 0 ? `red` : 'green'}">${CODES[data.code].income}%</span>/<span class="brown">${CODES[data.code].income_sort}` : ''}</span></td>
                                                                                <td>${Array.isArray(data.customAdjacentData) && data.customAdjacentData.length > 0 && `<span class="${data.customAdjacentData[0].sum > 0 ? 'red' : 'green'}">${data.customAdjacentData[0].sum}/${data.customAdjacentData[0].days}</span>` || ''}</td>
                                                                                <td><fund-valuation code="${data.code}" delay="${increment * 1000}" /></td>
                                                                                ${total_arr.map(total => {
                                                                            return `<td><span class="${(+data[total[0]]) > 0 ? 'red' : 'green'}">${data[total[0]]}%</span>/<span class="brown">${data[`${total[0]}_sort`]}</span></td>`
                                                                        }).join('')}
                                                                                <td>${data.customType ? data.customType : ''}</td>
                                                                                <td>
                                                                                    <div class="tip-container">
                                                                                        <div>${data.maxSaleTime ? `${data.maxSaleTime}天免` : ''}</div>
                                                                                        <div class="tip">
                                                                                            ${Array.isArray(data.saleTime) && data.saleTime.map(item => `<p>${item.time}，<span class="red">${item.rate}</span></p>`).join('')}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td style="padding:0;">
                                                                                    ${Tools.isSale(data.code).map((sale, index) => {
                                                                            return `
                                                                                            <div data-index="${index}" class="j-del-buyTime" style="padding:10px; ${(sale.rate && +sale.rate.rate.slice(0, -1) < 1.5) ? 'background-color:antiquewhite;' : ''}">
                                                                                                <p class="gray fs12">${sale.time}</p>
                                                                                                ${sale.str}
                                                                                                ${sale.rate ? `<div class="gray" title="${sale.rate.time}">${sale.rate.rate}，${sale.rate.str.replaceAll('red', '')}</div>` : ''}
                                                                                            </div>
                                                                                        `
                                                                        }).join('<div class="br" style="margin:0 10px;"></div>')}
                                                                                </td>
                                                                                <!-- <td>
                                                                                    ${CODES[data.code] && CODES[data.code].credit ? `信用占比${CODES[data.code].credit}%<br />` : ''}
                                                                                    <p class="fs12 gray j-show-investment">
                                                                                        ${CODES[data.code] && CODES[data.code].investment ? `
                                                                                            ${dtSly}%
                                                                                        `: ''}
                                                                                    </p>
                                                                                </td> -->
                                                                                <td class="j-code-asset-alert" style="font-size:12px; padding:2px 10px; ${(assetDp > 0 ? 'background:rgba(255,0,12,.1)' : assetDp < 0 ? 'background:rgba(0,128,0,.1)' : '')}">
                                                                                    ${data.asset && Tools.isNumber1(data.asset.jj) ? `基金：${data.asset.jj}%<br/>` : ''}
                                                                                    ${data.asset && Tools.isNumber1(data.asset.gp) ? `股票：${data.asset.gp}%<br/>` : ''}
                                                                                    ${data.asset && Tools.isNumber1(data.asset.zq) ? `债权：${data.asset.zq}%<br/>` : ''}
                                                                                    ${data.asset && Tools.isNumber1(data.asset.xj) ? `现金：${data.asset.xj}%<br/>` : ''}
                                                                                    ${data.asset && Tools.isNumber1(data.asset.qt) ? `其他：${data.asset.qt}%<br/>` : ''}
                                                                                </td>
                                                                                <td class="j-code-asset-alert" style="font-size:12px; padding:2px 10px; ${data.assetPosition && data.assetPosition.fundboodsDp && (data.assetPosition.fundboodsDp.price > 0 ? 'background:rgba(255,0,12,.1)' : data.assetPosition.fundboodsDp.price < 0 ? 'background:rgba(0,128,0,.1)' : '')}">
                                                                                    ${data.position && Tools.isNumber1(data.position.xx) ? `信用债：${data.position.xx}%<br/>` : ''}
                                                                                    ${data.position && Tools.isNumber1(data.position.lv) ? `利率债：${data.position.lv}%<br/>` : ''}
                                                                                    ${data.position && Tools.isNumber1(data.position.kzz) ? `<span class="red">可转债：${data.position.kzz}%</span><br/>` : ''}
                                                                                    ${data.position && Tools.isNumber1(data.position.qt) ? `其他：${data.position.qt}%` : ''}
                                                                                </td>
                                                                                <td style="font-size:12px; padding:2px 10px;">
                                                                                    ${data.uniqueInfo && Tools.isNumber1(data.uniqueInfo.stddev1) ? `最大波动：${+data.uniqueInfo.stddev1.toFixed(2)}%<br/>` : ''}
                                                                                    ${data.uniqueInfo && Tools.isNumber1(data.uniqueInfo.sharp1) ? `夏普比率：${+data.uniqueInfo.sharp1.toFixed(2)}%<br/>` : ''}
                                                                                    ${data.uniqueInfo && Tools.isNumber1(data.uniqueInfo.maxretra1) ? `最大回撤：${+data.uniqueInfo.maxretra1.toFixed(2)}%` : ''}
                                                                                </td>
                                                                                <td>${Array.isArray(data.netWorthDate) ? data.netWorthDate.join('<br />') : data.netWorthDate}</td>
                                                                                <td style="${(data.Ftype && data.Ftype.includes('混合型')) ? 'color:brown;' : ''}">
                                                                                    ${Array.isArray(data.Ftype) ? data.Ftype.join('<br />') : data.Ftype}
                                                                                    ${data.assetPosition && data.assetPosition.fundboods && Tools.showYh(data.assetPosition.fundboods) != 0 ? `<p class="green fs12">银行债：${Tools.showYh(data.assetPosition.fundboods).toFixed(2)}%</p>` : ''}
                                                                                </td>
                                                                            </tr>
                                                                        `
                                                                    }
                                                                }
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        // 判断排序class
        let sortClassname = '';
        if (SORT.sort == 1) sortClassname = 'ascending';
        if (SORT.sort == -1) sortClassname = 'descending';
        return `
        <table class="el-table">
            <thead>
                <tr>
                    <th><input type="checkbox" class="j-code-checkbox-sel" ${SORT.checked == 1 ? 'checked' : ''} />基金代码</th>
                    <th>
                        基金名称
                        ${Object.keys(EMOJIS).map(emoji => {
            return `<span class="emoji j-emoji ${SORT.emoji == emoji ? 'sel' : ''}">${emoji}</span>`;
        }).join('')}
                    </th>
                    <th>购后均日涨<span class="caret-wrapper ${SORT.day == 'income' ? sortClassname : ''}" data-day="income"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                    <th>连涨跌/幅度<span class="caret-wrapper ${SORT.day == 'sumLastDp' ? sortClassname : ''}" data-day="sumLastDp"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                    <th>基金估值<span class="caret-wrapper ${SORT.day == 'valuation' ? sortClassname : ''}" data-day="valuation"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                    ${total_arr.map(total => {
            return `<th>${total[1]}<span class="caret-wrapper ${SORT.day == total[0] ? sortClassname : ''}" data-day="${total[0]}"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>`
        }).join('')}
                    <th>
                        债权组合
                    </th>
                    <th>卖出时间</th>
                    <th>是否售出</th>
                    <!-- <th>定投收益</th> -->
                    <th>资产</th>
                    <th>持仓情况<span class="caret-wrapper ${SORT.day == 'credit' ? sortClassname : ''}" data-day="credit"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                    <th>特色数据</th>
                    <th>净值更新日期</th>
                    <th>债权类型</th>
                </tr>
            </thead>
            <tbody>
                ${str}
            </tbody>
        </table>
        `
    },
    setTable: (context) => {
        document.querySelector('.g-table').innerHTML = context;
    },
    setCon: (context) => {
        document.querySelector('.g-con').innerHTML = context;
    },
    initialization: () => {

        DATAS = customStorage.getItem('jijin.datas') || {};
        SORT = localStorage.getItem('jijin.sort') ? JSON.parse(localStorage.getItem('jijin.sort')) : {};
        CODES = customStorage.getItem('jijin.codes') || {};
        BONDS = localStorage.getItem('jijin.bonds') ? JSON.parse(localStorage.getItem('jijin.bonds')) : {};
        // console.log(Object.keys(BONDS).length)

        const con = `
            <div class="g-form">
                <style>
                    .m-search{
                        display:flex; align-items:center; height:auto; margin-bottom:15px;
                    }
                    .m-search .search_input{ width: 100px;}
                    .span-a a{
                        color:red;
                        margin-right:10px;
                        cursor: pointer;
                    }
                    .span-a a:hover{
                        opacity: .9;
                    }
                </style>
                <div class="m-search m-form">
                    <input class="search_input j-code-ipt" type="text" placeholder="债权代码" />
                    <span class="j-code-name gray" style="margin:0 5px;"></span>
                    <button class="search_btn reb j-code-add" style="margin-left:0px">添加债权</button>
                    <button class="search_btn green j-code-combination-add" style="margin-left:10px">添加组合</button>
                    <button class="search_btn j-code-updata" style="margin-left:10px">更新债权</button>
                    <button class="search_btn j-code-combination-updata" style="margin-left:10px">更新组合</button>
                    <button class="search_btn j-code-compare reb" style="margin-left:10px">对比债券</button>
                    <button class="search_btn j-code-compare-month" style="margin-left:10px">对比月债</button>
                    <button class="search_btn j-code-compare-bp" style="margin-left:10px">对比涨跌</button>
                    <button class="search_btn j-jjQuery-ele" style="margin-left:10px" onclick="javascript:jjQueryCenter.start();">估值查询</button>
                    <button class="search_btn j-code-download" style="margin-left:10px">下载数据</button>
                    <input class="search_input j-code-note-ipt" type="text" placeholder="备注信息" style="margin-left:10px; width:150px;" />
                    <button class="search_btn reb j-code-note-add" style="margin-left:0px">添加备注</button>
                    <!-- <input class="search_input j-code-credit-ipt" type="text" placeholder="信用占比" style="margin-left:10px;" />
                    <button class="search_btn reb j-code-credit-add" style="margin-left:0px">添加</button> -->
                    <span style="margin-left:10px; color:red;">筛选：</span>
                    ${Object.keys(FTYPES).map(Ftype => {
            return `<button class="search_btn j-code-filter-Ftype ${SORT.Ftype == Ftype ? 'reb' : ''}" data-ftype="${Ftype}" style="margin-left:10px">${FTYPES[Ftype]}</button>`
        }).join('')}
                    <input class="search_input j-code-name-ipt" type="text" placeholder="搜索名字/代码" style="margin-left:10px;" value="${SORT.name ? SORT.name : ''}" />
                    <input class="search_input j-code-type-ipt" type="text" placeholder="债权组合" style="margin-left:10px;" value="${SORT.type ? SORT.type : ''}" />
                    <input class="search_input j-code-Ftype-text-ipt" type="text" placeholder="债权类型" style="margin-left:10px;" value="${SORT.Ftype_text ? SORT.Ftype_text : ''}" />
                    <input class="search_input j-code-note-sort" type="text" placeholder="搜索备注" style="margin-left:10px;" value="${SORT.note ? SORT.note : ''}" />
                    <select class="search_input j-code-position-sort" style="margin-left:10px;width:auto;"><option value="">持仓情况</option><option value="kzz" ${SORT.position == 'kzz' ? 'selected' : ''}>可转债</option></select>
                    <select class="search_input j-code-sale_time-sel" style="margin-left:10px;width:auto;"><option value="">选择卖出时间</option>${Object.keys(SALETIME).map(sale_time => (`<option value="${sale_time}" ${SORT.sale_time == sale_time ? 'selected' : ''}>${SALETIME[sale_time]}</option>`)).join('')}</select>
                    <input class="search_input j-code-lv-sort" type="text" placeholder="利率债<=?" style="margin-left:10px;" value="${SORT.lv ? SORT.lv : ''}" />
                    <input class="search_input j-code-dtSly" type="text" placeholder="定投收益率>=?" style="margin-left:10px; width:110px;" value="${SORT.dtSly ? SORT.dtSly : ''}" />
                    <input class="search_input j-code-ratePositiveDay-sort" type="text" placeholder="连续正天数>=?" style="margin-left:10px; width:110px;" value="${SORT.ratePositiveDay ? SORT.ratePositiveDay : ''}" />
                    <span style="margin-left:10px; color:red; cursor: pointer;" class="j-code-filter-clear">清楚筛选</span>
                    <span style="margin-left:10px; color:red; cursor: pointer;" class="j-select-all">全选</span>
                    <span style="margin-left:10px; color:deepskyblue; cursor: pointer;" class="j-code-select-clear">清楚选择</span>
                    <span class="span-a" style="margin-left:10px;">
                    例如：<a class="j-sort-preset-span" data-sorts="${encodeURIComponent(JSON.stringify({ is_ct: '1' }))}">城投</a>
                    <a class="j-sort-preset-span" data-sorts="${encodeURIComponent(JSON.stringify({ type: '信用', sale_time: '7', ratePositiveDay: '20', day: 'customLastMonthGrowth', sort: '-1', Ftype: '2' }))}">信用</a>
                    </span>
                </div>
                <div class="m-search">
                    <input type="datetime-local" class="search_input mr10 j-buyTime-ipt" style="width:150px;" value="${Tools.getTime('yyyy-mm-dd hh:mm')}" />
                    <button class="search_btn mr10 j-buyTime-btn">插入购买时间</button>
                    <select class="search_input mr10 j-classify-ipt" style="width:auto;"><option value="">基金分类</option>${Object.keys(CLASSIFICATION).map(key => (`<option value="${key}" ${SORT.classify == key ? 'selected' : ''}>${CLASSIFICATION[key]}</option>`))}</select>
                    <button class="search_btn mr10 j-classify-btn">添加分类</button>
                    <button class="search_btn mr10 j-classify-btn-search">查询分类</button>
                    定投基金：<input class="search_input mr10" type="text" placeholder="" name="fcode" />
                    定投开始日：<input type="date" class="search_input mr10" name="dtStartDate" value="${Tools.getNowDate().start}" />
                    定投结束日：<input type="date" class="search_input mr10" name="dtEndDate" value="${Tools.getNowDate().now}" />
                    定投周期：每<input class="search_input" type="text" placeholder="" name="round" style="width:35px;" value="1" /><select class="mr10" name="roundType"><option value="1">周</option><!--<option value="2">月</option>--></select>
                    定投日：<select class="mr10" name="weekDtDay">${['星期一', '星期二', '星期三', '星期四', '星期五'].map((date, index) => `<option value="${index + 1}" ${index == 2 ? 'selected' : ''}>${date}</option>`)}</select>
                    每期定投金额：<input class="search_input mr10" type="text" placeholder="" name="dtAmount" value="200" />
                    <button class="search_btn reb j-fundDtCalculator">计算</button>
                    <span class="ml10 gray">移动止盈：设定目标收益率为<span class="red">20%</span>，止赢回撤比例为<span class="red">5%</span></span>
                </div>
            </div>
            <div style="margin-bottom:10px; color:gray;">选购策略：债权，信用债为主，7天，利率债<15%，最大回撤<0.6，夏普比率>4.8可转债看行情<span class="red j-sort-preset-span" style="margin-left:10px;" data-sorts="${encodeURIComponent(JSON.stringify({ Ftype: '2', type: '信用', sale_time: '7', lv: '10' }))}">筛选债券</span><span style="margin-left:10px; color:red; cursor: pointer;" class="j-code-filter-clear">清楚筛选</span>
                    <span style="margin-left:10px; color:red; cursor: pointer;" class="j-select-all">全选</span>
                    <span style="margin-left:10px; color:deepskyblue; cursor: pointer;" class="j-code-select-clear">清楚选择</span>，利率债购买，下跌之后如果小反弹多看2天，大回调直接买，出现回调直接卖</div>
            <div style="margin:10px 0;" class="gray">${JSON.stringify(SORT)}</div>
            <audio src="/public/uploads/1.mp3" controls="controls" class="audio" loop="true" style="display:none;"></audio>
            <div class="j-hj-gn"></div>
            <div class="j-hj-gj"></div>
            <div class="g-table"></div>
            <div class="g-con"></div>
            <div class="g-baidu-stocks" style="margin:15px 0;"></div>
            ${['大佬-2', '大佬-4', 9, 1, 3, 5, 6, 7, 8].map(name => {
            return `<view-img src="/public/uploads/${name}.jpg" ></view-img>`
        }).join('')}
            <div style="margin-top:15px;" class="j-datas-add">
                <textarea placeholder="复制进下载的数据" class="search_input" style="height:24px;"></textarea><button class="search_btn reb" style="margin-left:10px;vertical-align:bottom;">储存</button>
            </div>
        `;
        document.querySelector('.content').innerHTML = con;
        // 初始化收入
        // Object.keys(DATAS).forEach(code=>{
        //     Tools.upDateIncome(code);
        // })
        Tools.updateDatasTable();

        // 获取需要更新的列表
        const arr = Object.keys(DATAS).filter(code => {
            return Tools.isDebt(code) == 1;
        }).filter(code => {
            // 当前时间大约20点
            if (new Date().getHours() >= 20) {
                // if(new Date(DATAS[code].update_time).getHours()<20)return code;        
                let date = new Date();
                // 是周六周日
                if (date.getDay() == 0 || date.getDay() == 6) date = Tools.getWorkingDay(new Date().getTime(), '-');
                if (date.getDay() != new Date(DATAS[code].netWorthDate).getDay()) return code;
            } else {
                // 已经更新的不是上一个工作日
                let date = new Date();
                date.setDate(date.getDate() - 1);
                date = Tools.getWorkingDay(date.getTime(), '-');
                // console.log(date.getDay(),new Date(DATAS[code].netWorthDate).getDay())
                if (date.getDay() != new Date(DATAS[code].netWorthDate).getDay()) return code;
            }
        });
        console.log(arr.length);
        if (arr.length > 0) Tools.updatasCodes(document.querySelector('.j-code-updata'), arr);


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
                localStorage.setItem(key, JSON.stringify(obj[key]));
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
    }
})
// 初始化
Tools.initialization();
class Alert {
    constructor() {
        const $head = document.querySelector('head');
        const $style = document.createElement('style');
        $style.innerHTML = `
        .u-alert{
            position:fixed;
            top:0;
            left:0;
            right:0;
            bottom:0;
            display:none;
        }
        .u-alert .bg{
            position:absolute;
            top:0;
            left:0;
            right:0;
            bottom:0;
            background: rgba(0,0,0,.25);
        }
        .u-alert .con{
            background: #fff;
            padding: 20px;
            position: absolute;
            top:50%;
            left:50%;
            border-radius: 20px;
            transform: translate(-50%, -50%);
            line-height: 2;
            font-size: 16px;
            max-height: 80%;
            overflow-y: auto;
            max-width:99%;
        }
    `;
        $head.append($style);
        const $body = document.querySelector('body');
        const $alert = document.createElement('div');
        $alert.className = 'u-alert';
        $alert.innerHTML = `
        <div class="bg"></div>
        <div class="con"></div>
    `;
        this.$alert = $alert;
        // 储存数据
        this.data = undefined;
        $alert.querySelector('.bg').addEventListener('click', e => {
            $alert.style.display = 'none';
            // 删除数据
            this.data = undefined;
        });
        $body.append($alert);
    }
    show(con, cb) {
        const { $alert } = this;
        const $con = $alert.querySelector('.con');
        $con.innerHTML = con;
        $alert.style.display = 'block';
        $con.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        if (cb) cb(this);
    }
}
const myAlert = new Alert();
// myAlert.show('esdsds');
// Tools.fetch('007423,007424').then(res=>{
//     if(res.code=='200'){
//         const str = Tools.getTable(res.data);
//         Tools.setTable(str)
//     }
// })
// function addEventListener(el, eventName, eventHandler, selector) {
//     if (selector) {
//         const wrappedHandler = (e) => {
//             if (e.target && e.target.matches(selector)) {
//                 eventHandler(e);
//             }
//         };
//         el.addEventListener(eventName, wrappedHandler);
//         return wrappedHandler;
//     } else {
//         el.addEventListener(eventName, eventHandler);
//         return eventHandler;
//     }
// }
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
const $Content = document.querySelector('.content');
const $form = $Content.querySelector('.g-form');
const $table = $Content.querySelector('.g-table');
const $codeIpt = $form.querySelector('.j-code-ipt');
const $codeNoteIpt = $form.querySelector('.j-code-note-ipt');
const $codeCredit = $form.querySelector('.j-code-credit-ipt');
const $audio = $Content.querySelector('.audio');

// 拼凑tr数据
const getJZZL = (history) => {
    return [...history].map(data => `<tr><td>${data['FSRQ']}</td><td class="${data['JZZZL'] > 0 ? 'red' : 'green'}" style="text-align:right;">${data['JZZZL']}%</td></tr>`)
}
// 对比债基
const compareCodes = function (codes) {
    let str = '';
    str += '<div style="display:flex;">';
    let arr = [];
    codes.forEach(code => {
        arr.push(code);
        if (code.includes(',')) {
            arr = arr.concat(code.split(','))
        }
    })
    arr = [...new Set(arr)];
    // console.log(arr,codes);
    arr.forEach(code => {
        const { name, customNetWorkData } = DATAS[code];
        if (!customNetWorkData) return;
        str += `
        <div style="margin:0 10px;">
            <div style="text-align:center; margin-bottom:5px; color:gray; position: sticky; top:-20px; background:#fff;word-break:keep-all;">${Array.isArray(name) ? '组合' : name}</div>
            <table>
                <thead>
                    <tr><th>日期</th><th>日涨幅</th></tr>
                </thead>
                <tbody>
                    ${getJZZL(customNetWorkData).join('')}
                </tbody>
            </table>
            <div class="gray tac fs14 mt5 cp j-history-btn" data-pageIndex="1" data-code="${code}">点击拉取更多</div>
        </div>
        `
    })
    str += '</div>';
    myAlert.show(str);
}
// 点击拉取更多
addEventListener(myAlert.$alert, 'click', async e => {
    const $table = e.target.previousElementSibling;
    let pageIndex = e.target.getAttribute('data-pageIndex');
    const code = e.target.getAttribute('data-code');
    pageIndex++;
    const history = await Tools.fundMNHisNetList(code, pageIndex);
    if (history.length == 0) return e.target.remove();
    const $trs = getJZZL(history).join('');
    const $tbody2 = document.createElement('tbody');
    $tbody2.innerHTML = $trs;
    $table.appendChild($tbody2);

    e.target.setAttribute('data-pageIndex', pageIndex);
}, '.j-history-btn')
// 对比月债
const getCompareMonthTable = (arr, Month) => {
    let str = `
        <table>
            <thead>
                <tr><th></th>${arr.map(code => `<th><div class="owb" style="white-space:initial;">${DATAS[code].name}</div></th>`).join('')}</tr>
            </thead>
            <tbody>
                ${Object.keys(DATAS[arr[0]].customMonthData).map(month => {
        let arr_tmp = [...arr];
        arr_tmp.sort((a, b) => {
            return +DATAS[b].customMonthData[month] - +DATAS[a].customMonthData[month];
        })
        // console.log(arr_tmp)
        return `<tr class="${Month === month ? 'select' : ''}"><th>${month}</th>${arr.map(code => {
            const num = +DATAS[code].customMonthData[month];
            // console.log(arr_tmp,code)
            const index = (arr_tmp.indexOf(code) + 1);
            return `<td style="text-align:right;"><span class="${num > 0 ? 'red' : 'green'}">${num}%</span>/<span class="brown">${index}/${arr.length}</span></td>`
        }).join('')}</tr>`
    }).join('')}
            </tbody>
        </table>
    `;
    return str;
}
const compareMonthCodes = function (codes) {
    let str = '';
    str += '<div style="display:flex;">';
    let arr = [];
    codes.forEach(code => {
        arr.push(code);
        if (code.includes(',')) {
            arr = arr.concat(code.split(','))
        }
    })
    arr = [...new Set(arr)];
    // console.log(arr,codes);
    // 筛选出来customMonthData不存在的
    arr = arr.filter(code => DATAS[code] && DATAS[code].customMonthData);
    if (arr.length == 0) return alert('没有数据');
    str += `
        <div style="margin:0 10px;" class="custom-month">
            ${getCompareMonthTable(arr)}
        </div>
    `
    str += '</div>';
    myAlert.show(str, () => {
        // console.log(myAlert.$alert.querySelector('.custom-month'));
        const $month = myAlert.$alert.querySelector('.custom-month');
        addEventListener($month, 'click', e => {
            const $th = e.target;
            const month = $th.innerHTML;
            // arr排序
            arr.sort((a, b) => {
                return +DATAS[b].customMonthData[month] - +DATAS[a].customMonthData[month];
            })
            $month.innerHTML = getCompareMonthTable(arr, month);
        }, 'tbody>tr>th')
    });
}
// 对比涨跌
const compareBp = function (codes) {
    let str = '';
    str += '<div style="display:flex;">';
    let arr = [];
    codes.forEach(code => {
        arr.push(code);
        if (code.includes(',')) {
            arr = arr.concat(code.split(','))
        }
    })
    arr = [...new Set(arr)];
    // console.log(arr,codes);
    arr.forEach(code => {
        const { name, customAdjacentData } = DATAS[code];
        if (!customAdjacentData) return;
        str += `
        <div style="margin:0 10px;">
            <div style="text-align:center; margin-bottom:5px; color:gray; position: sticky; top:-20px; background:#fff;word-break:keep-all;">${Array.isArray(name) ? '组合' : name}</div>
            <table>
                <thead>
                    <tr><th>日期</th><th>日涨幅</th></tr>
                </thead>
                <tbody>
                    ${[...customAdjacentData].map(data => `<tr><td class="gray">${data.start}~<br/>${data.next}</td><td class="${data['sum'] > 0 ? 'red' : 'green'}" style="text-align:right;">${data['sum']}%/<span class="gray">${data['days']}</span></td></tr>`).join('')}
                </tbody>
            </table>
        </div>
        `
    })
    str += '</div>';
    myAlert.show(str);
}
// 对比债基
addEventListener($form, 'click', e => {
    const codes = Tools.getSelCodes();
    if (codes.length > 0) compareCodes(codes);
}, '.j-code-compare')
addEventListener($form, 'click', e => {
    const codes = Tools.getSelCodes();
    if (codes.length > 0) compareMonthCodes(codes);
}, '.j-code-compare-month')
addEventListener($form, 'click', e => {
    const codes = Tools.getSelCodes();
    if (codes.length > 0) compareBp(codes);
}, '.j-code-compare-bp')
// 对比
addEventListener($table, 'click', e => {
    const $tr = e.target.closest('tr');
    if ($tr.classList.contains('select')) {
        $tr.classList.remove('select')
    } else {
        $tr.classList.add('select');
    }
}, 'tr')
// 基金名称点击
addEventListener($table, 'click', e => {
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    compareCodes([code]);
}, '.j-code-name')
// 基金分类被点击
addEventListener($table, 'click', e => {
    const classify = e.target.innerHTML;
    const $trs = $table.querySelectorAll('tbody>tr');
    Array.from($trs).forEach($tr => {
        const code = $tr.getAttribute('data-code');
        if (CODES[code] && CLASSIFICATION[CODES[code].classify] == classify) {
            // console.log(DATAS[code].name,classify);
            $tr.classList.add('select')
        } else {
            $tr.classList.remove('select')
        }
    })
}, '.j-classify')
// 定投点击
addEventListener($table, 'click', e => {
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    const investment = CODES[code].investment;
    let str = '';
    let total = { totalPrincipal: 0, totalSy: 0, dtSly: 0 };
    Object.keys(investment).forEach(weekDtDay => {
        total.totalPrincipal += (+investment[weekDtDay].totalPrincipal);
        total.totalSy += (+investment[weekDtDay].totalSy);
        total.dtSly += (+investment[weekDtDay].dtSly);
    })
    const strategy = investment[1].strategy;
    str += `
        <div style="margin:0 10px;">
            <div style="text-align:center; margin-bottom:5px; color:gray; position: sticky; top:-20px; background:#fff;word-break:keep-all;font-size:12px;line-height:1.5">定投开始日：${strategy.dtStartDate}，定投结束日：${strategy.dtEndDate}，<br />定投金额：${strategy.dtAmount}，每${strategy.round}周定投</div>
            <table>
                <thead>
                    <tr><th>定投时间</th><th>定投总期数</th><th>投入总本金</th><th>总收益</th><th>定投收益率</th></tr>
                </thead>
                <tbody>
                    ${Object.keys(investment).map(weekDtDay => `<tr><td>星期${weekDtDay}</td><td>${investment[weekDtDay]['dtPeriods']}期</td><td>${(+investment[weekDtDay]['totalPrincipal']).toFixed(2)}</td><td>${(+investment[weekDtDay]['totalSy']).toFixed(2)}</td><td>${(+investment[weekDtDay]['dtSly']).toFixed(2)}%</td></tr>`).join('')}
                    <tr><td></td><td>total</td><td>${total.totalPrincipal.toFixed(2)}</td><td>${total.totalSy.toFixed(2)}</td><td>${(total.dtSly / 5).toFixed(2)}%</td></tr>
                </tbody>
            </table>
        </div>
        `
    myAlert.show(str);
}, '.j-show-investment')
// 持仓情况点击
addEventListener($table, 'click', e => {
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    const Data = DATAS[code];
    if (!Data.assetPosition) return;
    let str = `<div style="text-align:center; margin-bottom:5px; color:gray; position: sticky; top:-20px; background:#fff;word-break:keep-all">${Data.name}${Data.assetPosition.updateTime ? `<p style="font-size:12px;">${Data.assetPosition.updateTime}<span class="red j-fundUpdata" style="margin-left:10px;cursor:pointer;">更新</span></p>` : ''}</div>`;
    str += '<div style="display:flex;">';
    // 基金情况
    const etf = Data.assetPosition.etf;
    if (+Data.asset.jj > 0) {
        str += `
            <div style="margin:0 10px;">
                <table>
                    <thead>
                        <tr><th>代码</th><th>基金名称</th><th>持仓占比</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${etf['code']}</td>
                            <td>${etf['name']}</td>
                            <td>${Data.asset.jj}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `
    }
    // 如果有联接基金
    if (Data.ljjj) {
        // 联接股票情况
        const fundStocks = Data.ljjj.assetPosition.fundStocks;
        const fundStocksDiff = Data.ljjj.assetPosition.fundStocksDiff;
        const { gprice, stockce } = Data.ljjj.assetPosition.fundStocksDp;

        if (fundStocks) {
            str += `
                <div style="margin:0 10px;">
                    <table>
                        <thead>
                            <tr><th>联接股票名称</th><th>价格<p class="fs12 fwn ${gprice > 0 ? 'red' : gprice < 0 ? 'green' : ''}" style="margin-top:-8px;">${gprice}</p></th><th>持仓占比<p class="gray fs12 fwn" style="margin-top:-8px;">${stockce.toFixed(2)}%</p></th></tr>
                        </thead>
                        <tbody>
                            ${fundStocks.map(data => `
                                <tr>
                                    <td>${data['GPJC']}</td>
                                    <td class="${(fundStocksDiff[data.GPDM] && +fundStocksDiff[data.GPDM]['f3'] > 0) ? 'red' : (fundStocksDiff[data.GPDM] && +fundStocksDiff[data.GPDM]['f3'] < 0) ? 'green' : ''}">${fundStocksDiff[data.GPDM] ? `${fundStocksDiff[data.GPDM]['f2']}/${fundStocksDiff[data.GPDM]['f3']}%` : ''}</td>
                                    <td>${data['JZBL']}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `
        }
    }

    // 股票情况
    const fundStocks = Data.assetPosition.fundStocks;
    const fundStocksDiff = Data.assetPosition.fundStocksDiff;
    const { gprice, stockce } = Data.assetPosition.fundStocksDp;

    if (fundStocks) {
        str += `
            <div style="margin:0 10px;">
                <table>
                    <thead>
                        <tr><th>股票名称</th><th>价格<p class="fs12 fwn ${gprice > 0 ? 'red' : gprice < 0 ? 'green' : ''}" style="margin-top:-8px;">${gprice}</p></th><th>持仓占比<p class="gray fs12 fwn" style="margin-top:-8px;">${stockce.toFixed(2)}%</p></th></tr>
                    </thead>
                    <tbody>
                        ${fundStocks.map(data => `
                            <tr>
                                <td style="line-height:1;"><div>${data['GPJC']}</div><span class="u-box-1" style="margin-top:4px;">${data['INDEXNAME']}</span></td>
                                <td class="${(fundStocksDiff[data.GPDM] && +fundStocksDiff[data.GPDM]['f3'] > 0) ? 'red' : (fundStocksDiff[data.GPDM] && +fundStocksDiff[data.GPDM]['f3'] < 0) ? 'green' : ''}">${fundStocksDiff[data.GPDM] ? `${fundStocksDiff[data.GPDM]['f2']}/${fundStocksDiff[data.GPDM]['f3']}%` : ''}</td>
                                <td>${data['JZBL']}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `
    }
    // 债权情况
    const fundboods = Data.assetPosition.fundboods;
    const fundboodsDiff = Data.assetPosition.fundboodsDiff;
    const { price, boodce } = Data.assetPosition.fundboodsDp;

    if (fundboods) {
        str += `
            <div style="margin:0 10px;">
                <table>
                    <thead>
                        <tr><th>债权代码</th><th>债权名称</th><th>价格${price != 0 ? `<p class="fs12 fwn ${price > 0 ? 'red' : price < 0 ? 'green' : ''}" style="margin-top:-8px;">${price}</p>` : ''}</th><th>持仓占比<p class="gray fs12 fwn" style="margin-top:-8px;">${boodce.toFixed(2)}%</p></th><th>债权类型</th><th>债权标签</th></tr>
                    </thead>
                    <tbody>
                        ${fundboods.map(data => `<tr><td>${data['ZQDM']}</td><td>${data['ZQMC']}</td><td class="${(fundboodsDiff[data.ZQDM] && +fundboodsDiff[data.ZQDM]['f3'] > 0) ? 'red' : (fundboodsDiff[data.ZQDM] && +fundboodsDiff[data.ZQDM]['f3'] < 0) ? 'green' : ''}">${fundboodsDiff[data.ZQDM] ? `${fundboodsDiff[data.ZQDM]['f2']}/${fundboodsDiff[data.ZQDM]['f3']}%` : ''}</td><td>${data['ZJZBL']}%</td><td>${{ '1': '信用债', '2': '利率债', '3': '可转债', '4': '其他', '5': '同业存单' }[data.BONDTYPE]}</td><td>${BONDS[data['ZQDM']] && BONDS[data['ZQDM']].map(label => `<span class="u-box mr5">${label}</span>`).join('') || ''}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `
    }
    str += '</div>';
    myAlert.show(str, Alert => {
        // console.log(Alert);
        const $alert = Alert.$alert;
        $alert.querySelector('.j-fundUpdata').addEventListener('click', event => {
            Tools.upDateFundDiff(Data.code).then(res => {
                e.target.click();
            })
        })
    });
}, '.j-code-asset-alert')
//点击代码填写进入上面的ipt
addEventListener($table, 'click', e => {
    const $code = e.target;
    const code = $code.textContent;
    $codeIpt.value = code;
    $codeNoteIpt.value = ((CODES[code] && CODES[code].note) ? CODES[code].note : '');
    document.querySelector('.j-code-name').textContent = (DATAS[code].name);
}, '.j-code')
// 添加代码
addEventListener($form, 'click', async e => {
    const $btn = e.target;
    if ($btn.ing == 1) return;
    $btn.ing = 1;
    $btn.innerHTML = '正在添加';
    const code = $codeIpt.value;
    await Tools.getCode(code);
    $codeIpt.value = '';
    alert('添加成功');
    $btn.ing = 0;
    $btn.innerHTML = '添加债权';
    // 开始筛选
    // Tools.setCustomSort({ name: code });
    const $codeNameFilter = document.querySelector('.j-code-name-ipt');
    $codeNameFilter.value = code;
    Tools.dispatchEvent($codeNameFilter, 'input');
    // window.location.reload();
    Tools.updateDatasTable();
}, '.j-code-add')
// 添加组合
addEventListener($form, 'click', e => {
    const codes = Tools.getSelCodes();
    if (codes.length > 0) Tools.addCombinationCode(codes);
}, '.j-code-combination-add')
// 添加重点
// addEventListener($form, 'click', e => {
//     const code = $codeIpt.value;
//     Tools.setCustomCodes(code, { keynote: 1 });
//     Tools.updateDatasTable();
// }, '.j-code-keynote')
// 删除重点
// addEventListener($table, 'click', e => {
//     const code = e.target.closest('[data-code]').getAttribute('data-code');
//     // console.log(code)
//     if (confirm('确定取消重点基金吗?')) {
//         Tools.setCustomCodes(code, { keynote: 0 });
//         Tools.updateDatasTable();
//     }
// }, '.j-code-keynote-del')
// 添加抗跌
// addEventListener($form, 'click', e => {
//     const code = $codeIpt.value;
//     Tools.setCustomCodes(code, { shield: 1 });
//     Tools.updateDatasTable();
// }, '.j-code-shield')
// 删除抗跌
// addEventListener($table, 'click', e => {
//     const code = e.target.closest('[data-code]').getAttribute('data-code');
//     // console.log(code)
//     if (confirm('确定取消抗跌基金吗?')) {
//         Tools.setCustomCodes(code, { shield: 0 });
//         Tools.updateDatasTable();
//     }
// }, '.j-code-shield-del')
// 删除重仓
// addEventListener($table, 'click', e => {
//     const code = e.target.closest('[data-code]').getAttribute('data-code');
//     // console.log(code)
//     if (confirm('确定取消重仓基金吗?')) {
//         Tools.setCustomCodes(code, { heavy: 0 });
//         Tools.updateDatasTable();
//     }
// }, '.j-code-heavy-del')
// 删除emoji
addEventListener($table, 'click', e => {
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    const emoji = e.target.getAttribute('data-emoji');
    // console.log(code)
    if (confirm(`确定取消${EMOJIS[emoji].title}吗?`)) {
        Tools.setCustomCodes(code, { [EMOJIS[emoji].key]: 0 });
        Tools.updateDatasTable();
    }
}, '.j-code-emoji-del')
// 添加限额
// addEventListener($form, 'click', e => {
//     const code = $codeIpt.value;
//     Tools.setCustomCodes(code, { limit: 1 });
//     Tools.updateDatasTable();
// }, '.j-code-limit')
// 删除限额
// addEventListener($table, 'click', e => {
//     const code = e.target.closest('[data-code]').getAttribute('data-code');
//     // console.log(code)
//     if (confirm('确定取消限额基金吗?')) {
//         Tools.setCustomCodes(code, { limit: 0 });
//         Tools.updateDatasTable();
//     }
// }, '.j-code-limit-del')
// 添加备注
addEventListener($form, 'click', e => {
    const code = $codeIpt.value;
    const note = $codeNoteIpt.value;
    Tools.setCustomCodes(code, { note: note });
    alert('添加成功');
    $codeNoteIpt.value = '';
    Tools.updateDatasTable();
}, '.j-code-note-add')
// 添加信用占比
addEventListener($form, 'click', e => {
    const code = $codeIpt.value;
    const credit = $codeCredit.value;
    Tools.setCustomCodes(code, { credit: credit });
    // alert('添加成功');
    $codeCredit.value = '';
    Tools.updateDatasTable();
}, '.j-code-credit-add')
// 更新债权
addEventListener($form, 'click', async e => {
    const $btn = e.target;
    Tools.updatasCodes($btn, Object.keys(DATAS));
}, '.j-code-updata')
// 更新组合
addEventListener($form, 'click', e => {
    const $btn = e.target;
    if ($btn.ing != undefined) return;
    $btn.ing = 1;
    const maxLength = Object.keys(DATAS).length;
    $btn.innerHTML = `正在更新`;
    for (let code in DATAS) {
        // console.log(code); 
        const datas = DATAS[code];
        if (code.includes(',')) {
            // console.log(code);
            const codes = code.split(',');
            Tools.addCombinationCode(codes);
        }
    }
    $btn.ing = undefined;
    $btn.innerHTML = '更新组合';
    Tools.updateDatasTable();
    alert('更新成功');
}, '.j-code-combination-updata')
// 选择基金代码
addEventListener($table, 'change', e => {
    const $checkbox = e.target;
    const checked = $checkbox.checked;
    const code = $checkbox.closest('tr').getAttribute('data-code');
    // 删掉买入时间，重仓基金
    if (!checked) {
        Tools.setCustomCodes(code, { buy_time: '' });
        Tools.setCustomCodes(code, { heavy: '' })
    } else {
        //设置买入时间
        Tools.addBuyTime(code);
    }
    Tools.setCustomCodes(code, { checked: checked ? 1 : 0 });
    Tools.updateDatasTable();
}, '.j-code-checkbox')
// 筛选基金
addEventListener($table, 'change', e => {
    const $checkbox = e.target;
    const checked = $checkbox.checked;
    Tools.setCustomSort({ checked: checked ? 1 : 0 });
}, '.j-code-checkbox-sel')
// 筛选emoji
addEventListener($table, 'click', e => {
    const $emoji = e.target;
    let emoji = $emoji.textContent.trim();
    if ($emoji.classList.contains('sel')) {
        emoji = '';
    }
    Tools.setCustomSort({ emoji: emoji });
}, '.j-emoji')
// 选择基本类型
// addEventListener($table, 'change', e => {
//     const $select = e.target;
//     const selected = $select.value;
//     const code = $select.closest('tr').getAttribute('data-code');
//     Tools.setCustomCodes(code, { type: selected });
// }, '.j-code-type')
// 筛选债权组合
addEventListener($form, 'input', Tools.throttle(e => {
    const type = e.target.value;
    Tools.setCustomSort({ type: type });
}, 500), '.j-code-type-ipt')
// 筛选债券类型text
addEventListener($form, 'input', Tools.throttle(e => {
    const type = e.target.value;
    Tools.setCustomSort({ Ftype_text: type });
}, 500), '.j-code-Ftype-text-ipt')
// 筛选卖出时间
addEventListener($form, 'change', e => {
    const sale_time = e.target.value;
    Tools.setCustomSort({ sale_time });
}, '.j-code-sale_time-sel')
// 基金买入时间
// addEventListener($table, 'change', e => {
//     const $buyTime = e.target;
//     const buy_time = $buyTime.value;
//     const code = $buyTime.closest('tr').getAttribute('data-code');
//     Tools.setCustomCodes(code, { buy_time });
//     Tools.updateDatasTable();
// }, '.j-code-buy-time')
// 筛选名字
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ name: value });
}, 500), '.j-code-name-ipt')
// 筛选债基
addEventListener($form, 'click', e => {
    const $Ftype = e.target;
    if ($Ftype.classList.contains('reb')) {
        $Ftype.classList.remove('reb');
        Tools.setCustomSort({ Ftype: '' });
        return;
    }
    const Ftype = $Ftype.getAttribute('data-ftype');
    Tools.setCustomSort({ Ftype: Ftype });
    Array.from(document.querySelectorAll('.j-code-filter-Ftype')).filter(ele => {
        if (ele === $Ftype) {
            ele.classList.add('reb');
        } else {
            ele.classList.remove('reb');
        }
    })
}, '.j-code-filter-Ftype')
// 筛选备注
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ note: value });
}, 500), '.j-code-note-sort')
addEventListener(document, 'click', e => {
    // const value = e.target.textContent;
    // const $noteSort = document.querySelector('.j-code-note-sort');
    // $noteSort.value = value;
    // Tools.dispatchEvent($noteSort, 'input');
    // Tools.setCustomSort({ note: value });
    const $target = e.target;
    const sorts = $target.getAttribute('data-sorts');
    const obj = JSON.parse(decodeURIComponent(sorts));
    // console.log(obj);
    // Tools.restoreInitialValue(document.querySelectorAll('.m-form .search_input'))
    Tools.dispatchEvent(document.querySelector('.j-code-filter-clear'), 'click');
    Tools.setCustomSort(obj);
    location.reload();
}, '.j-sort-preset-span')
// 筛选利率债
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ lv: value });
}, 500), '.j-code-lv-sort')
// 添加基金分类
addEventListener($form, 'click', Tools.throttle(e => {
    const value = document.querySelector('.j-classify-ipt').value;
    const code = $codeIpt.value;
    Tools.setCustomCodes(code, { classify: value });
    alert('添加分类成功');
    Tools.updateDatasTable();
}, 500), '.j-classify-btn')
// 查询基金分类
addEventListener($form, 'click', e => {
    const value = document.querySelector('.j-classify-ipt').value;
    Tools.setCustomSort({ classify: value });
    Tools.updateDatasTable();
}, '.j-classify-btn-search')
// 筛选定投收益率
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ dtSly: value });
}, 500), '.j-code-dtSly')
// 筛选利率债
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ ratePositiveDay: value });
}, 500), '.j-code-ratePositiveDay-sort')
// 筛选持仓
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ position: value });
}, 500), '.j-code-position-sort')
// 清除筛选
addEventListener($Content, 'click', e => {
    delete SORT.type;
    delete SORT.name;
    delete SORT.checked;
    delete SORT.emoji;
    delete SORT.sale_time;
    delete SORT.note;
    delete SORT.position;
    delete SORT.lv;
    delete SORT.dtSly;
    delete SORT.ratePositiveDay;
    delete SORT.is_ct;
    delete SORT.classify;
    $form.querySelector('.j-code-name-ipt').value = '';
    $form.querySelector('.j-code-type-ipt').value = '';
    $form.querySelector('.j-code-note-sort').value = '';
    $form.querySelector('.j-code-sale_time-sel').value = '';
    $form.querySelector('.j-code-position-sort').value = '';
    $form.querySelector('.j-code-lv-sort').value = '';
    $form.querySelector('.j-code-dtSly').value = '';
    $form.querySelector('.j-code-ratePositiveDay-sort').value = '';
    $form.querySelector('.j-classify-ipt').value = '';
    Tools.storageDatas();
    Tools.updateDatasTable();
}, '.j-code-filter-clear')
// 全选
addEventListener($Content, 'click', e => {
    Tools.selectAllTrs();
}, '.j-select-all')
// 清除选择
addEventListener($Content, 'click', e => {
    Tools.updateDatasTable();
}, '.j-code-select-clear')
// 定投计算
document.querySelector('.j-fundDtCalculator').addEventListener('click', async e => {
    const $parent = e.target.closest('div.m-search');
    const inputsAndSelects = $parent.querySelector('input[name=fcode]');
    const code = inputsAndSelects.value;
    if (!code) return 'fcode不存在';
    if (!DATAS[code]) return `DATAS里面不存在${code}`;
    Tools.countInvestment([code]);
    alert('计算成功');
}, false)
// 选择卖出时间
// addEventListener($table, 'change', e => {
//     const $select = e.target;
//     const selected = $select.value;
//     const code = $select.closest('tr').getAttribute('data-code');
//     Tools.setCustomCodes(code, { sale_time: selected });
// }, '.j-sale-time')
// 删除代码
// addEventListener($table, 'click', e => {
//     if (confirm('确定删除吗？')) {
//         const target = e.target;
//         const $tr = target.closest('tr');
//         const code = $tr.getAttribute('data-code');
//         Tools.delCode(code);
//     }
// }, '.j-code-del')
// 排序
addEventListener($table, 'click', e => {
    const target = e.target;
    const $parent = target.parentNode;
    const day = $parent.getAttribute('data-day');
    let sort = 0;
    if (target.classList.contains('ascending')) {
        // 点击升序
        if ($parent.classList.contains('ascending')) {
            // 取消升序
            $parent.classList.remove('ascending');
            sort = 0;
        } else {
            // 升序排列
            $parent.classList.add('ascending');
            $parent.classList.remove('descending');
            sort = 1;
        }
    }
    if (target.classList.contains('descending')) {
        // 点击降序
        if ($parent.classList.contains('descending')) {
            // 取消降序
            $parent.classList.remove('descending');
            sort = 0;
        } else {
            // 降序排列
            $parent.classList.add('descending');
            $parent.classList.remove('ascending');
            sort = -1;
        }
    }
    Tools.setSort({ day, sort });
}, '.sort-caret')
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
        'jijin.datas': customStorage.getItem('jijin.datas'),
        'jijin.sort': JSON.parse(localStorage.getItem('jijin.sort')),
        'jijin.codes': customStorage.getItem('jijin.codes'),
        'jijin.bonds': JSON.parse(localStorage.getItem('jijin.bonds')),
    }
    MDownload([JSON.stringify(data)], '基金数据');
    // console.log(JSON.stringify(data));
    localStorage.setItem('jijin.downloadTime', new Date().toLocaleString());
}
if (localStorage.getItem('jijin.downloadTime')) {
    if ((new Date().getTime() - 1 * 24 * 60 * 60 * 1000) > new Date(localStorage.getItem('jijin.downloadTime')).getTime() || new Date(localStorage.getItem('jijin.downloadTime')).getDate() != new Date().getDate()) {
        Download();
    }
} else {
    Download();
}
addEventListener($form, 'click', Download, '.j-code-download')
// 点击copy
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
addEventListener($table, 'click', e => {
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
// 删除购物时间
addEventListener($table, 'click', e => {
    const $target = e.target.closest('.j-del-buyTime');
    const index = $target.getAttribute('data-index');
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    if (confirm(`确定删除（${DATAS[code].name}）的第${Number(index) + 1}条购买记录吗`)) {
        Tools.delBuyTime(code, index);
        Tools.updateDatasTable();
    }
}, '.j-del-buyTime')
// 添加购买时间
addEventListener($form, 'click', e => {
    const buy_time = Tools.getTime('yyyy-mm-dd hh:mm:ss', document.querySelector('.j-buyTime-ipt').value);
    const code = $codeIpt.value;
    Tools.addBuyTime(code, buy_time);
    Tools.updateDatasTable();
}, '.j-buyTime-btn')
// 监听右键点击事件
class Contextmenu {
    constructor() {
        const $div = document.createElement('div');
        $div.innerHTML = `
            <style>
                /* 样式化右键菜单 */
                .context-menu {
                    position: absolute;
                    border: 1px solid #e7dfdf;
                    padding: 10px 0;
                    background: #fff;
                    line-height: 2;
                    font-size: 14px;
                    border-radius：10px;
                    box-shadow:0px 0px 10px rgba(0,0,0,.3);
                    min-width: 135px;
                    max-width: 160px;
                }

                .context-menu .context-menu-item {
                    padding: 10px 20px;
                    cursor: pointer;
                    text-align: center;
                }

                .context-menu .context-menu-item:hover {
                    background-color: #ddd;
                }
                .context-menu .br{
                    height:1px;
                    background: #e7dfdf;
                }
            </style>
            <!-- 鼠标右键菜单 -->
            <div class="context-menu" style="display:none;">
                <div class="name" style="text-align:center;border-bottom:1px solid #e7dfdf;padding:5px;font-size: 14px; color:gray;line-height:1.4;"></div>
                ${Object.keys(EMOJIS).map(emoji => {
            return `<div class="context-menu-item" data-emoji="${emoji}">添加${EMOJIS[emoji].title.substr(0, 2)}${emoji}</div>`;
        }).join('')}
                <div class="context-menu-item">点击天天✅</div>
                <div class="context-menu-item">点击查询✅</div>
                <div class="context-menu-item">更新基金🔃</div>
                <div class="context-menu-item">更新债权🔃</div>
                <div class="context-menu-item">删除基金🔃</div>
                <div class="context-menu-item">更新定投🔃</div>
                <div class="context-menu-item">显示代码🔻</div>
                <div class="context-menu-item">添购时间⏱</div>
                <div class="br"></div>
                <div class="context-menu-item">对比债权❇️</div>
                <div class="context-menu-item">对比月债❇️</div>
                <div class="context-menu-item">对比涨跌❇️</div>
                <div class="context-menu-item">筛选债权✅</div>
                <div class="context-menu-item">列表基金🔃</div>
                <div class="context-menu-item">列表债券🔃</div>
                <div class="context-menu-item">列表持仓🔃</div>
                <div class="context-menu-item">列表定投🔃</div>
                <div class="br"></div>  
                <div style="padding: 10px; font-size:12px;display: flex; justify-content: space-between;"><span style="color:red;cursor: pointer;" class="j-code-filter-clear">清楚筛选</span><span class="j-select-all">全选</span><span style=" color:deepskyblue; cursor: pointer;" class="j-code-select-clear">清楚选择</span></div>
            </div>
        `
        const $body = document.querySelector('body');
        $body.append($div);
        this.$menu = $div.querySelector('.context-menu');
        this.$name = $div.querySelector('.name');
        // 阻止浏览器默认的右键菜单
        addEventListener($table, 'contextmenu', event => {
            event.preventDefault();
            const $tr = event.target.closest('tr');
            const Data = DATAS[$tr.getAttribute('data-code')];
            this.Data = Data;
            this.$tr = $tr;
            // 显示右键菜单
            this.show(event);
        }, 'tbody>tr')
        // 取消弹窗
        addEventListener($table, 'click', e => {
            this.hide();
        })
        // 点击菜单
        addEventListener(this.$menu, 'click', e => {
            this.item(e.target);
        }, '.context-menu-item')
        this.$menu.querySelector('.j-code-filter-clear').addEventListener('click', e => {
            $form.querySelector('.j-code-filter-clear').click();
            this.hide();
        })
        this.$menu.querySelector('.j-code-select-clear').addEventListener('click', e => {
            $form.querySelector('.j-code-select-clear').click();
            this.hide();
        })
        this.$menu.querySelector('.j-select-all').addEventListener('click', e => {
            $form.querySelector('.j-select-all').click();
            this.hide();
        })
    }
    show(event) {
        this.$menu.style.display = 'block';
        this.$name.innerHTML = `${this.Data.name}`;
        var x = event.clientX + window.scrollX;
        var y = event.clientY + window.scrollY;
        var maxX = window.innerWidth + window.scrollX - this.$menu.offsetWidth - 20;
        var maxY = window.innerHeight + window.scrollY - this.$menu.offsetHeight - 20;
        x = Math.min(x, maxX);
        y = Math.min(y, maxY);
        this.$menu.style.left = x + "px";
        this.$menu.style.top = y + "px";
    }
    hide() {
        this.$menu.style.display = 'none';
    }
    async item($item) {
        const con = $item.textContent;
        const emoji = $item.getAttribute('data-emoji');
        const Data = this.Data;
        const code = Data.code;
        const _this = this;
        if (emoji) {
            Tools.setCustomCodes(code, { [EMOJIS[emoji].key]: 1 });
            Tools.updateDatasTable();
            this.hide();
        }
        if (con.includes('点击天天')) {
            window.open(`https://fund.eastmoney.com/${code}.html`, '_blank')
            this.hide();
        }
        if (con.includes('点击查询')) {
            window.open(`https://www.dayfund.cn/fundvalue/${code}.html`, '_blank')
            this.hide();
        }
        if (con.includes('更新基金')) {
            // this.$tr.querySelector('.j-code').click();
            // document.querySelector('.j-code-add').click();
            const codes = [code];
            Tools.updatasCodes(document.querySelector('.j-code-updata'), codes);
            this.hide();
        }
        if (con.includes('更新债权')) {
            await Tools.getBondInfosByData(Data);
            alert('更新完成');
            this.hide();
        }
        if (con.includes('删除基金')) {
            if (confirm(`确定删除（${Data.name}）吗`)) {
                Tools.delCode(code);
            }
            this.hide();
        }
        if (con.includes('添购时间')) {
            Tools.addBuyTime(code);
            Tools.updateDatasTable();
            this.hide();
        }
        if (con.includes('更新定投')) {
            Tools.countInvestment([code]).then(res => {
                _this.hide();
            })
        }
        if (con.includes('对比债权')) {
            $form.querySelector('.j-code-compare').click();
            this.hide();
        }
        if (con.includes('对比月债')) {
            $form.querySelector('.j-code-compare-month').click();
            this.hide();
        }
        if (con.includes('对比涨跌')) {
            $form.querySelector('.j-code-compare-bp').click();
            this.hide();
        }
        if (con.includes('筛选债权')) {
            const codes = Tools.getSelCodes();
            const $codeNameIput = document.querySelector('.j-code-name-ipt');
            $codeNameIput.value = codes.join(',');
            Tools.dispatchEvent($codeNameIput, 'input');
            _this.hide();
        }
        if (con.includes('列表基金')) {
            const codes = Tools.getNowCodes();
            Tools.updatasCodes(document.querySelector('.j-code-updata'), codes);
            this.hide();
        }
        if (con.includes('列表债券')) {
            // await Tools.getBondInfosByData(Data);
            // alert('更新完成');
            // this.hide();
            const result = confirm('确定查询吗');
            if (!result) return;
            const codes = Tools.getNowCodes();
            const $span = document.createElement('span');
            $span.style = 'color:gray;'
            $item.append($span);
            await Tools.getBondInfosByDatas(codes.map(code => DATAS[code]), (pm) => {
                $span.innerHTML = `${pm}/${codes.length}`
            })
            $span.remove();
            this.hide();
            Tools.updateDatasTable();
        }
        if (con.includes('列表持仓')) {
            const codes = Tools.getNowCodes();
            const $span = document.createElement('span');
            $span.style = 'color:gray;'
            $item.append($span);
            let index = 0;
            for (let code of codes) {
                index++;
                $span.innerHTML = `${index}/${codes.length}`
                await Tools.upDateFundDiff(code);
            }
            $span.remove();
            this.hide();
            Tools.updateDatasTable();
        }
        if (con.includes('列表定投')) {
            const codes = Tools.getNowCodes();
            const $span = document.createElement('span');
            $span.style = 'color:gray;'
            $item.append($span);
            Tools.countInvestment(codes, (result, pm) => {
                $span.innerHTML = pm;
            }).then(res => {
                $span.remove();
                _this.hide();
            })
        }
        if (con.includes('显示代码')) {
            console.log(Data);
            console.log(CODES[Data.code]);
            this.hide();
        }
    }
}
const Menu = new Contextmenu();
// 黄金
class HJ {
    constructor(ele, params) {
        this.timer = null;
        this.data = {};
        this.$ele = document.querySelector(ele);
        this.$ele.classList.add('gray')
        this.$ele.style = `margin:15px 0; display:flex;`;
        this.$ele.innerHTML = `<div class="hj-con"></div>`;
        this.codes = params.codes;
        this.max = params.max;
        this.min = params.min;
        this.zl = params.zl;
        this.title = params.title;
        this.jk_min_price = params.jk_min_price;
        this.jk_max_price = params.jk_max_price;
        this.jker = false;
        if (this.jk_min_price || this.jk_max_price) this.jker = true;
        // 判断是否有本地储存的键控制
        if (this.jker) {
            const hj = localStorage.getItem('jijin.hj');
            if (hj) {
                const jk = JSON.parse(hj);
                if (jk[this.codes]) {
                    const jk_codes = jk[this.codes];
                    this.jk_min_price = jk_codes.jk_min_price;
                    this.jk_max_price = jk_codes.jk_max_price;
                }
            }
            // 后面插入一段html，输入监控价
            // 输入格式为 100/101
            this.$ele.insertAdjacentHTML('beforeend', `<div class="hj-jk" style="margin-left:10px;"><span class="red j-jk-btn">${this.jker ? `取消监控` : `监控`}</span>：<input type="text" pattern="\d+\/\d+" class="search_input ti0 tam" style="width:60px;" value="${this.jk_min_price}/${this.jk_max_price}" /></div>`)
            addEventListener(this.$ele, 'change', e => {
                const $ipt = e.target;
                const value = $ipt.value;
                const reg = /^(\d+)\/(\d+)$/;
                const match = value.match(reg);
                if (match) {
                    const minPrice = match[1];
                    const maxPrice = match[2];
                    this.jk_min_price = minPrice;
                    this.jk_max_price = maxPrice;
                    this.updateHtml();
                    // 保存到本地
                    localStorage.setItem('jijin.hj', JSON.stringify({
                        [this.codes]: {
                            jk_min_price: this.jk_min_price,
                            jk_max_price: this.jk_max_price
                        }
                    }));

                }
            }, '.hj-jk input')
            addEventListener(this.$ele, 'click', (e) => {
                const $btn = e.target;
                if (this.jker) {
                    this.jker = false;
                    this.closeJkAudio();
                    $btn.innerHTML = '监控';
                } else {
                    this.jker = true;
                    $btn.innerHTML = '取消监控';
                }
            }, '.j-jk-btn')
        }
        // 判断是不是周末
        let dayOfWeek = new Date().getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            this.getHj().then(() => {
                this.startTimer();
            });
        } else {
            this.$ele.style.display = 'none';
        }
        addEventListener(this.$ele, 'click', (e) => {
            if (this.timer) {
                this.clearTimer();
            } else {
                this.startTimer();
            }
        }, '.j-hj-btn')
    }
    async getHj() {
        const res = await Tools.fetch('hj', { codes: this.codes });
        this.data = {
            kp: res.q1,//开盘价
            sp: res.q64,//收盘价
            zg: res.q3,//最高价
            zd: res.q4,//最低价
            xj: res.q63,//现价
            time: res.time
        }
        if (this.jker) {
            // 如果现价大于小于监控价报警，现价振幅大于2%报警，振幅大约10快的报警
            if (this.data.xj < this.jk_min_price ||
                this.data.xj >= this.jk_max_price
                // || Math.abs(this.data.xj - this.data.kp) / this.data.kp > 0.015
                // || Math.abs(this.data.xj - this.data.kp) > 10
            ) {
                this.startJkAutio();
            } else {
                this.closeJkAudio();
            }
        }
        this.updateHtml();
    }
    updateHtml() {
        this.$ele.querySelector('.hj-con').innerHTML = `${this.title} 
        现价：<span class="red" style="font-size:18px;">${this.data.xj}</span>，
        开盘价:${this.data.kp}，收盘价：${this.data.sp}，最高价：${this.data.zg}，最低价：${this.data.zd} ${new Date(this.data.time).toLocaleString()}
        <span class="red j-hj-btn" style="margin:0 10px;">${this.timer ? '暂停' : '开始'}</span>
        <div class="map"></div>`;
        this.drawMap(this.$ele.querySelector('.map'));
    }
    startTimer() {
        this.$ele.querySelector('.j-hj-btn').innerHTML = '暂停';
        this.timer = setInterval(() => {
            this.getHj();

        }, 1 * 60 * 1000);
    }
    clearTimer() {
        this.$ele.querySelector('.j-hj-btn').innerHTML = '开始';
        clearInterval(this.timer);
        this.timer = null;
    }
    startJkAutio() {
        $audio.play();
    }
    closeJkAudio() {
        $audio.pause();
    }
    drawMap($map) {
        const max = this.max;
        const min = this.min;
        const zl = this.zl;
        const now_max = +this.data.zg;
        const now_min = +this.data.zd;
        const now = +this.data.xj;
        const unit = 200;
        const dis_unit = unit / (max - min);
        $map.style = 'display:inline-block;vertical-align:0px;';
        $map.innerHTML = `
            <span style="margin-right:5px;">${min}</span>
            <span class="con" style="width:${unit}px;height:5px;background:#e4e4e4;display:inline-block;vertical-align:2px;position:relative;">
                <span class="now" style="height:100%;background:#1e80ff;display:inline-block;position:absolute;width:${dis_unit * (now_max - now_min)}px;left:${dis_unit * (now_min - min)}px;">
                    <span class="now_z" style="display:inline-block;height:100%;width:2px;background:red;position:absolute;left:${(now - now_min) * dis_unit}px;">
                        <span style="position:absolute;top:0;left:50%;transform:translate(-50%, -100%)">${((now - min) / (max - min) * 100).toFixed(2)}%</span>
                    </span>
                </span>
                <span style="display:inline-block;height:200%;width:2px;background:green;position:absolute;bottom:0;left:${(zl - min) * dis_unit}px;">
                    <span style="position:absolute;top:0;left:50%;transform:translate(-50%, 80%);white-space: nowrap;">阻力线${zl}</span>
                </span>
            </span>
            <span style="margin-left:5px;">${max}</span>
        `;
    }
}
new HJ('.j-hj-gn', { codes: 'JO_9753', max: 840, min: 600, zl: 626, title: '国内黄金', jk_min_price: 606, jk_max_price: 630 });
new HJ('.j-hj-gj', { codes: 'JO_92233', max: 3500, min: 2500, zl: 2650, title: '国际黄金' });
// 查看图片
class ViewImg extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                .img{
                    max-width:150px;
                }
                .con{
                    display:inline-block
                }
            </style>
            <div class="con">
                <!-- <div class="title" style="text-align:center;font-size:14px;">title</div>-->
                <img class="img">
            </div>
        `;
        this.$img = shadow.querySelector('.img');
        this.$img.src = this.getAttribute('src');

        this.addEventListener('click', this.handleImageClick.bind(this))
    }
    handleImageClick() {
        myAlert.show(`<img src="${this.$img.src}" style="width:400px;" />`)
    }
}
customElements.define('view-img', ViewImg);
// 定义基金估值自动查询
class FundValuation extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <span></span>
        `;
        this.code = this.getAttribute('code');
        this.$span = shadow.querySelector('span');
        if (this.code && Tools.isDebt(this.code) == 1) {
            // console.log(this.delay);
            let code = this.code;
            const name = DATAS[this.code].name;
            if (name.includes('联接') && DATAS[this.code].assetPosition && DATAS[this.code].assetPosition.etf) {
                code = DATAS[this.code].assetPosition.etf.code;
            }
            if (CODES[this.code] && CODES[this.code].valuation) {
                this.valuation = CODES[this.code].valuation;
                this.fill();
            }
            jjQueryCenter.addCode(code, this.code);
            jjQueryCenter.addEventListener('valuation', (e) => {
                const value = e.detail;
                if (value.code != code) return;
                Tools.setCustomCodes(this.code, {
                    valuation: value
                });
                this.valuation = value;
                this.fill();
            })
        }
    }
    fill() {
        // 去掉年份，去掉秒
        const date = this.valuation.date.replace(/\d{4}-/, '').replace(/:\d{2}$/, '');
        this.$span.innerHTML = `<span>${this.valuation.valuation + '%'}</span><br><span style="font-size:12px;color:gray;">${date}</span>`;
        this.$span.title = this.valuation.date;
        if (this.valuation.valuation < 0) {
            this.$span.style.color = 'green';
        } else {
            this.$span.style.color = 'red';
        }
    }
}
customElements.define('fund-valuation', FundValuation);
// tab
addEventListener($Content, 'click', e => {
    const $target = e.target.closest('.tab-label');
    if ($target) {
        // 找到$target同级别包含active的元素
        const headerChildren = Array.from($target.closest('.tab-header').children);
        headerChildren.forEach(item => {
            if (item.classList.contains('active')) {
                item.classList.remove('active');
            }
        })
        $target.classList.add('active');
        // 找到$target的索引
        const index = headerChildren.indexOf($target);
        const content = Array.from($target.closest('.tab-header').nextElementSibling.children);
        content.forEach(item => {
            item.classList.remove('active');
        })
        content[index].classList.add('active');
    }
}, '.tab-label');
class BaiduStocks {
    constructor() {
        const Stocks = customStorage.getItem('jijin.stocks') || {};
        this.stocks = Stocks?.stocks || {};
        this.day = Tools.getTime('yyyy-mm-dd');
        this.$con = document.querySelector('.g-baidu-stocks');
        this.now_day = Tools.getTime('yyyy-mm-dd');
        this.up_stocks = Stocks?.up_stocks || {};

        console.log(Stocks);

        // 如果this.stocks大于5个就取最近的5个
        const max = 15;
        if (Object.keys(this.stocks).length > max) {
            const keys = Object.keys(this.stocks);
            keys.forEach(key => {
                if (key < keys[keys.length - max]) {
                    delete this.stocks[key];
                }
            })
        }

        // delete this.stocks['2025-07-02'].season['300118']
        // delete this.stocks['2025-07-02'].season['600876']
        // delete this.stocks['2025-07-02'].season['688303']
        // this.storage();

        // Object.keys(this.stocks).forEach(day=>{
        //     const obj = this.stocks[day];
        //     // console.log(obj.stocks)
        //     obj.stocks.forEach((stock,index)=>{
        //         // const {first,second} = stock;
        //         // this.stocks[day].stocks[index].firstIndustry=first;
        //         // this.stocks[day].stocks[index].secondIndustry=second;
        //         delete this.stocks[day].stocks[index].first;
        //         delete this.stocks[day].stocks[index].second;
        //     })

        // })
        // // console.log(this.stocks)
        // customStorage.setItem('jijin.baiduStocks', this.stocks);
    }
    async getrelatedblock(code) {
        // 获取股票的相关行业 https://finance.pae.baidu.com/api/getrelatedblock?stock=%7B%22market%22:%22ab%22,%22type%22:%22stock%22,%22code%22:%22000632%22%7D&finClientType=pc
        const url = `https://finance.pae.baidu.com/api/getrelatedblock?stock=%7B%22market%22:%22ab%22,%22type%22:%22stock%22,%22code%22:%22${code}%22%7D&finClientType=pc`;
        const result = await Tools.fetch('http', { url });
        return result;
    }
    async getSeason(name, Hexin) {
        // 获取股票的涨停原因
        const result = await Tools.fetch('ansStock', { name, 'Hexin-V': Hexin })
        // console.log(result.data.answer[0].txt[0].content.components[5].data.datas);
        const datas = result.data.answer[0].txt[0].content.components?.[5]?.data?.datas;
        // console.log(result1)
        return datas;
    }
    async getStockKline(code, exchange) {
        // 计算这只股票最近10天的涨跌情况
        let type;
        switch (exchange) {
            case 'SZ':
                type = 0;
                break;
            case 'SH':
                type = 1;
                break;
            default:
                type = 0;
                break;
        }
        const dps = await Tools.fetch('stockKline', { code: code, type: type, klt: 101, lmt: 10, fqt: 1, end: Tools.getTime('yyyymmdd') });
        const klines = dps.data.klines.map(kline => {
            const arr = kline.split(',');
            return {
                date: arr[0],
                rate: arr[8]
            }
        });
        return klines;
    }
    async pullStocks(page = 0, cb = () => { }) {

        const ranks = await Tools.fetch('baiduRank', { index: page });
        const lists = ranks.Result.list.body;
        // console.log(lists);
        const arr = [];
        let isToBottom = false;
        for (const [index, body] of lists.entries()) {
            // console.log(index,body)
            const stock = { name: body.name, code: body.code };

            const rate = parseFloat(body.pxChangeRate.replace(/[^0-9.-]/g, ''));
            if (rate < 9) {
                isToBottom = true;
                break;
            }
            stock.rate = rate;
            stock.exchange = body.exchange;
            // 获得相关行业
            const relatedblock = await this.getrelatedblock(body.code);
            Object.assign(stock, {
                firstIndustry: relatedblock.Result[body.code][0].list[0].name,
                secondIndustry: relatedblock.Result[body.code][0].list[1].name,
                industry: relatedblock.Result[body.code][0].list.map(industry => ({ name: industry.name, ratio: industry.ratio, code: new URLSearchParams(industry.xcx_query).get('code') }))
            })
            // 获取日K线
            stock.klines = await this.getStockKline(body.code, body.exchange);

            // const detail = await Tools.fetch('baiduDetail', { code: body.code });
            // let klines = [];
            // try {
            //     klines = detail.Result.content.fundFlowMinute.data.split(',').reduce((acc, _, i) => {
            //         if (i % 10 === 0) {
            //             acc.push(arr.slice(i, i + 10));
            //         }
            //         return acc;
            //     }, []).slice(-10).reverse();
            // } catch (e) {
            //     console.log(e);
            // }
            // Object.assign(stock, {
            //     rate: rate,
            //     firstIndustry: detail.Result.content.fundFlowBlock.result[0].industry.name,
            //     secondIndustry: detail.Result.content.fundFlowBlock.result[1].industry.name,
            //     // klines,
            // })
            // 计算这只股票最近10天的涨跌情况
            // const dps = await Tools.fetch('stockKline',{code:body.code,type:1,klt:101,lmt:10,fqt:1,end:Tools.getTime('yyyymmdd')});
            // const klines = dps.data.klines.map(kline=>kline.split(',')[8]).reverse();
            // Object.assign(stock,{klines});

            arr.push(stock);
            cb && cb(page, index);
            await Tools.delayExecute(500);
        }
        this.stocks[this.day].stocks.push(...arr);
        if (!isToBottom) {
            page += 20;
            await Tools.delayExecute(2000);
            await this.pullStocks(page, cb);
        }
        // console.log(arr);
        // return arr;
    }
    storage() {
        // customStorage.setItem('jijin.baiduStocks', this.stocks);
        customStorage.setItem('jijin.stocks', { stocks: this.stocks, up_stocks: this.up_stocks });
    }
    async getStocks(cb) {
        if (!this.stocks[this.day]) {
            this.stocks[this.day] = {};
        }
        Object.assign(this.stocks[this.day], { update_time: Tools.getTime(), stocks: [] })
        await this.pullStocks(0, cb);
        this.storage();
    }
    format(stocks) {
        const obj = {};
        const Industry = {};
        for (let stock of stocks) {
            const { firstIndustry, secondIndustry } = stock;
            if (!obj[firstIndustry]) {
                obj[firstIndustry] = { [secondIndustry]: 1 };
                if (stock.industry) {
                    Industry[firstIndustry] = stock.industry[0];
                    Industry[secondIndustry] = stock.industry[1];
                }
            } else {
                if (!obj[firstIndustry][secondIndustry]) {
                    obj[firstIndustry][secondIndustry] = 1;
                    if (stock.industry) Industry[secondIndustry] = stock.industry[1];
                } else {
                    obj[firstIndustry][secondIndustry]++;

                }
            }
        }
        // console.log(obj)
        // console.log(Industry);
        // [第一行业，数量，[{name,num,rate,code}],第一行业{name,rate,code}]
        return Object.keys(obj).map(industry => [
            industry,
            Object.values(obj[industry]).reduce((a, b) => a + b, 0),
            Object.keys(obj[industry]).map(secondIndustry => ({ name: secondIndustry, num: obj[industry][secondIndustry], rate: Industry[secondIndustry]?.ratio, code: Industry[secondIndustry]?.code })).sort((a, b) => b.num - a.num),
            Industry[industry]
        ]).sort((a, b) => b[1] - a[1]);

    }
    async init() {
        // console.log(this.format(this.stocks[this.day].stocks), this.stocks[this.day].update_time, this.day);
        // console.log(this.stocks);

        // 循环this.stocks找到连板大于4的股票存起来
        Object.keys(this.stocks).forEach(day => {
            const obj = this.stocks[day];
            obj.stocks.forEach(stock => {
                if (!this.up_stocks[stock.code] && this.countConsecutiveOver9(stock.klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate)) >= 4) {
                    this.up_stocks[stock.code] = stock;
                }
            })
        })
        console.log(this.up_stocks)
        // this.up_stocks['003029']['exchange']='SZ';
        // this.up_stocks['603022']['exchange']='SH';
        this.storage();

        this.updateHtml();

        // 更新
        addEventListener(this.$con, 'click', async (e) => {
            await this.JupUpdata(true);
        }, '.update_btn');

        await this.JupUpdata(false);
        // 双击删除
        addEventListener(this.$con, 'dblclick', e => {
            e.stopPropagation();
            const $target = e.target.closest('.day');
            const day = $target.dataset.day;
            if (confirm(`确定删除吗（${day}）？`)) {
                delete this.stocks[day];
                this.storage();
                this.updateHtml();
            }
        }, '.day')
        // 龙头行业更新
        addEventListener(this.$con, 'click', async (e) => {
            const $target = e.target.closest('.j-up_stock-updata');
            const stocks = Object.values(this.up_stocks);
            // console.log(stocks);
            for (let index = 0; index < stocks.length; index++) {
                const stock = stocks[index];
                $target.innerHTML = `正在更新 ${index + 1}/${stocks.length}`;
                // 获取日K线
                try {
                    this.up_stocks[stock.code].klines = await this.getStockKline(stock.code, stock.exchange);
                    // 获得相关行业
                    const relatedblock = await this.getrelatedblock(stock.code);
                    Object.assign(stock, {
                        firstIndustry: relatedblock.Result[stock.code][0].list[0].name,
                        secondIndustry: relatedblock.Result[stock.code][0].list[1].name,
                        industry: relatedblock.Result[stock.code][0].list.map(industry => ({ name: industry.name, ratio: industry.ratio, code: new URLSearchParams(industry.xcx_query).get('code') }))
                    })
                } catch (error) {
                    console.log(error);
                }
                await Tools.delayExecute(500);
            }
            $target.innerHTML = '更新';
            this.storage();
            this.updateHtml();
        }, '.j-up_stock-updata');
        // 更新day的数据
        addEventListener(this.$con, 'click', async (e) => {
            const $target = e.target.closest('.j-stock-updata');
            const day = $target.closest('[data-day]').dataset.day;
            const stocks = this.stocks[day].stocks;
            for (let [index, stock] of stocks.entries()) {
                $target.innerHTML = `正在更新 ${index + 1}/${stocks.length}`;
                // 获取日K线
                this.stocks[day].stocks[index].klines = await this.getStockKline(stock.code, stock.exchange);
                await Tools.delayExecute(500);
            }
            $target.innerHTML = '更新';
            this.storage();
            this.updateHtml();
        }, '.j-stock-updata');
        // 更新涨停板原因
        addEventListener(this.$con, 'click', async (e) => {
            const $target = e.target.closest('.season_btn');
            const day = $target.closest('[data-day]').dataset.day;
            const stocks = this.stocks[day].stocks.filter(stock => !this.stocks[day].season || !this.stocks[day].season[stock.code]);
            const Hexin = document.querySelector('.season_input').value;
            if (!Hexin) return alert('请输入hexin')
            if (!this.stocks[day].season) this.stocks[day].season = {};
            try {
                for (let [index, stock] of stocks.entries()) {
                    $target.innerHTML = `正在更新 ${index + 1}/${stocks.length}`;
                    // 获取日K线
                    this.stocks[day].season[stock.code] = await this.getSeason(stock.name, Hexin);
                    this.storage();
                    await Tools.delayExecute(500);
                }
            } catch (error) {
                console.log(error);
            }
            $target.innerHTML = '更新涨停板原因';
            this.storage();
            this.updateHtml();
        }, '.season_btn');
        // const detail = await Tools.fetch('baiduDetail', { code: "688499" });
        // let klines = [];
        // try {
        //     klines = detail.Result.content.fundFlowMinute.data.split(';').slice(-10).reverse();
        // } catch (e) {
        //     console.log(e);
        // }
        // console.log(klines)

        // const relatedblock = await this.getrelatedblock('000632');
        // console.log(relatedblock.Result['000632'][0].list[0].name,relatedblock.Result['000632'][0].list[1].name);

        // console.log(await this.getStockKline(300635,'SZ'))

        // const result = await Tools.fetch('ansStock', { name: '长城军工' })
        // console.log(result.data.answer[0].txt[0].content.components[5].data.datas);
        // const text = result.data.answer[0].txt[0].content.components[5].data.datas[0]['重要事件内容']
        // // 匹配时间（格式：YYYY年MM月DD日 HH时MM分SS秒）
        // const timeRegex = /(\d{4}年\d{2}月\d{2}日 \d{2}时\d{2}分\d{2}秒)/;
        // // 匹配涨停原因（冒号后到句号前的内容）
        // const reasonRegex = /涨停原因：([^。]+)/;

        // const timeMatch = text.match(timeRegex);
        // const reasonMatch = text.match(reasonRegex);

        // const result1 = {
        //     time: timeMatch ? timeMatch[1] : null,
        //     涨停原因: reasonMatch ? reasonMatch[1] : null
        // };
        // console.log(result1)

    }
    getTime() {
        let date = new Date();
        let time = Tools.getTime('yyyy-mm-dd');
        // 是周六周日
        if (date.getDay() == 0 || date.getDay() == 6) {
            date = Tools.getWorkingDay(new Date().getTime(), '-');
            time = Tools.getTime('yyyy-mm-dd', date.getTime());
        } else {
            // 当前时间大约9:30
            if (new Date() >= new Date(Tools.getTime('yyyy/mm/dd 9:30'))) {
                let time = Tools.getTime('yyyy-mm-dd');
            } else {
                // 已经更新的不是上一个工作日
                date.setDate(date.getDate() - 1);
                date = Tools.getWorkingDay(date.getTime(), '-');
                time = Tools.getTime('yyyy-mm-dd', date.getTime());
            }
        }
        return time;
    }
    async JupUpdata(isAlert = true) {
        let isUpdata = false;
        const time = this.getTime();

        if (!this.stocks[time]) {
            isUpdata = true;
        } else if (new Date(this.stocks[time].update_time) < new Date(Tools.getTime('yyyy/mm/dd 15:00', new Date(time).getTime()))) {
            if (new Date() > new Date(Tools.getTime('yyyy/mm/dd 15:00'))) {
                isUpdata = true;
            } else if (new Date(new Date().getTime() - 1 * 15 * 60 * 1000) > new Date(this.stocks[time].update_time)) {
                isUpdata = true;
            }
        }
        this.day = time;
        if (isUpdata) {
            const $target = this.$con.querySelector('.update_btn');
            this.updataStocksByEle($target);
        } else {
            if (isAlert) alert('无需更新')
        }
    }
    async updataStocksByEle($target) {
        // this.updataStocks();
        // this.updateHtml();
        $target.innerHTML = '正在更新';
        await this.getStocks((page, index) => {
            $target.innerHTML = `正在更新第${parseInt(page / 20 + 1, 10)}页，${index + 1}/20`;
        });
        $target.innerHTML = '更新';
        this.updateHtml();
    }
    getStocksTableHtml(stocks, day = Tools.getTime('yyyy-mm-dd')) {
        function getNowSeason(datas, day) {
            let result = {};
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                if (data['重要事件名称'] == '涨停') {
                    let str = data['重要事件内容'];
                    // 匹配涨停原因（冒号后到句号前的内容）
                    const reasonRegex = /涨停原因：([^。]+)/;

                    const time = data['重要事件公告时间'];
                    const reasonMatch = str.match(reasonRegex);
                    if (reasonMatch) {
                        result = {
                            time: time,
                            season: reasonMatch ? reasonMatch[1] : null
                        }
                        break;
                    }
                }
            }
            return result;
        }
        return `
            <table>
                <thead>
                    <tr>
                        <th>序号/${stocks.length}</th>
                        <th>股票</th>
                        <th>涨幅</th>
                        <th>连板</th>
                        <th>涨停原因</th>
                        <th>行业</th>
                    </tr>
                </thead>
                <tbody>
                    ${stocks.map((stock, stockIndex) => {
            const sDay = this.countConsecutiveOver9(stock.klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate));
            return `
                            <tr class="${sDay % 2 == 0 ? 'even' : ''}">
                                <td style="text-align:center;">${stockIndex + 1}</td>
                                <td>
                                    <a href="https://gushitong.baidu.com/stock/ab-${stock.code}" target="_blank">${stock.name}</a> 
                                    <a href="https://www.iwencai.com/unifiedwap/result?tid=stockpick&qs=box_main_ths&w=${stock.name}" target="_blank">${stock.code}</a>
                                </td>
                                <td>
                                    <div class="tip-container">
                                        <div>
                                            ${(stock.klines && stock.klines[stock.klines.length - 1].rate != stock.rate) ? `<span class="${+stock.klines[stock.klines.length - 1].rate > 0 ? 'red' : 'green'}">${stock.klines[stock.klines.length - 1].rate}</span><p class="gray fs12">${stock.klines[stock.klines.length - 1].date}</p>` : stock.rate}
                                        </div>
                                        <div class="tip">
                                            ${stock.klines.map(line => `<p class="p-item">${line.date}：<span class="${+line.rate > 0 ? 'red' : 'green'}">${line.rate}</span></p>`).join('')}

                                        </div>
                                    </div>
                                </td>
                                <td>${sDay}</td>
                                <td>${this.stocks[day] && this.stocks[day].season && this.stocks[day].season[stock.code] ? `
                                    <div class="tip-container">
                                        <div>${getNowSeason(this.stocks[day].season[stock.code], day).season}</div>
                                        <div class="tip">
                                            ${this.stocks[day].season[stock.code].map(line => `<p class="p-item">${line['重要事件名称']}：${line['重要事件内容']}</p>`).join('')}
                                        </div>
                                    </div>
                                `: ''}</td>
                                <td>${stock.industry ? `<a href="https://gushitong.baidu.com/block/ab-${stock.industry[0].code}" target="_blank">${stock.industry[0].name}</a> <span class="gray fs12"><a href="https://gushitong.baidu.com/block/ab-${stock.industry[1].code}" target="_blank">${stock.industry[1].name}</a></span>` : ''}</td>
                            `
        }).join('')}
                </tbody>
            </table>
        `
    }
    getIndustryHtml(obj) {
        const industy = this.format(obj);
        return `
            <table>
                <thead>
                    ${industy.map(stock => {
            return `
                            <th>${stock[3] ? `<a href="https://gushitong.baidu.com/block/ab-${stock[3].code}" target="_blank">${stock[0]}</a> <span style="font-weight: normal;" class="fs12 ${stock[3].ratio.includes('+') > 0 ? 'red' : 'green'}">${stock[3].ratio}</span>` : stock[0]}</th>
                        `;
        }).join('')}
                                                            </thead>
                                                            <tbody>
                                                                ${industy.map(stock => {
            return `
                                                                    <td style="vertical-align: top;">
                                                                        <p>数量：${stock[1]}</p>
                                                                        ${stock[2].map(val => {
                return `
                                                                                <p class="gray fs12">${val.code ? `<a href="https://gushitong.baidu.com/block/ab-${val.code}" target="_blank">${val.name}</a><span style="font-weight: normal; font-size:9px;" class="${val.rate.includes('+') > 0 ? 'red' : 'green'}">${val.rate}</span>` : val.name}：${val.num}</p>
                                                                            `;
            }).join('')}
                                                                    </td>
                                                                `;
        }).join('')}
                                                            </tbody>
                                                        </table>
        `;
    }
    countConsecutiveOver9(arr) {
        let arr1 = [...arr];
        arr1.reverse();
        const index = arr1.findIndex(num => num < 9);
        return index === -1 ? arr1.length : index;
    }
    updateDailyLimit() {
        const arr = Object.keys(this.stocks).filter(day => this.stocks[day].stocks[0].klines).sort((a, b) => new Date(b) - new Date(a)).slice(0, 5);
        let str = `
            <div class="tab-container">
                <div class="tab-header">
                        <span class="tab-label">行业龙头 <span class="red j-up_stock-updata">更新</span></span>
                    ${arr.map((day, index) => {
            return `
                            <span class="tab-label ${index == 0 ? 'active' : ''}" data-day="${day}">${day}${index == 1 ? ` <span class="red j-stock-updata">更新</span>` : ''}</span>

                        `
        }).join('')}
        <button class="search_btn reb update_btn" style="margin-left:10px;">更新</button>
        <button class="search_btn season_btn" style="margin-left:10px;" data-day="${arr[0]}">更新涨停板原因</button>
        <input type="text" class="search_input season_input" placeholder="输入Hexin-V" />
                </div>
                <div class="tab-content">
                    <div class="tab-item">
                        ${this.getStocksTableHtml(Object.values(this.up_stocks).sort((a, b) => {
                            const klines_a = this.countConsecutiveOver9(a.klines.map(d => +d.rate));
                            const klines_b = this.countConsecutiveOver9(b.klines.map(d => +d.rate));
                            // console.log(klines_a-klines_b);
                            return klines_b - klines_a;
                        }))}
                    </div>
                    ${arr.map((day, index) => {
            const stocks = this.stocks[day].stocks.sort((a, b) => {
                const klines_a = this.countConsecutiveOver9(a.klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate));
                const klines_b = this.countConsecutiveOver9(b.klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate));
                // console.log(klines_a-klines_b);
                return klines_b - klines_a;
            });
            // console.log(day,stocks);
            return `
                            <div class="tab-item ${index == 0 ? 'active' : ''}" data-day="${day}">
                            <div class="day" data-day="${day}">${this.getIndustryHtml(this.stocks[day].stocks)}</div>
                            <div style="display:flex;align-items: baseline; margin-top:15px;">
                                ${this.getStocksTableHtml(stocks, day)}
                                <table style="margin-left:15px;">
                                    <thead>
                                        <tr>
                                            <th>连板天数</th>
                                            <th>行业统计</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${stocks.reduce((result, current, index) => {
                if (index == 0 || this.countConsecutiveOver9(current.klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate)) != this.countConsecutiveOver9(stocks[index - 1].klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate))) {
                    result.push([current]);
                } else {
                    result[result.length - 1].push(current);
                }
                return result;
            }, []).map(arr => {
                return `
                                                <tr>
                                                    <td style="text-align:center;">${this.countConsecutiveOver9(arr[0].klines.filter(d => new Date(d.date) <= new Date(day)).map(d => +d.rate))}/${arr.length}</td>
                                                    <td>
                                                        ${this.getIndustryHtml(arr)}
                                                    </td>
                                                </tr>
                                            `
            }).join('')}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        `
        }).join('')}
                </div>
            </div>
        `;
        return str;
    }
    updateHtml() {
        this.$con.innerHTML = this.updateDailyLimit();
        // this.updateDailyLimit();
    }
}
const baiduStocks = new BaiduStocks();
baiduStocks.init();