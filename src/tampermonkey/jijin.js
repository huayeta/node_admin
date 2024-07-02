// https://api.doctorxiong.club/v1/fund?code=007423
// https://api.doctorxiong.club/v1/fund/detail?code=007423
// https://kouchao.github.io/TiantianFundApi/apis/ 所有api信息
// 更新的话先 cd E:\work\TiantianFundApi-main 然后npm run start

// {code:...data}
let DATAS = {};
// {day:total_arr[0][0]|credit,sort:-1|1|0,type:债权组合,checked:1|0是否筛选购买的,name:筛选名字,note:筛选备注,emoji:keynote|shield,sale_time:SALETIME,position:持仓情况,lv:利率债小于等于,dtSly:定投收益率大于等于}
let SORT = {};
// {code:{checked:1,type:code_type_arr[0]债权组合,sale_time:7|30卖出时间,note:备注,keynote:重点,shield:抗跌,heavy:重仓,buy_time:买入时间,credit:信用值,income:购买后平均收益率,limit:限额,Ftype:债权类型,investment:定投相关}}
let CODES = {};
const total_arr = [['dayGrowth', '日涨幅'], ['customLastWeekGrowth', '最近周涨幅'], ['custom2LastWeekGrowth', '最近2周涨幅'], ['customLastMonthGrowth', '最近月涨幅'], ['lastWeekGrowth', '周涨幅'], ['lastMonthGrowth', '月涨幅'], ['lastThreeMonthsGrowth', '3月涨幅'], ['lastSixMonthsGrowth', '6月涨幅'], ['lastYearGrowth', '年涨幅']];
const code_type_arr = ['利率债', '信用债', '利率债为主', '信用债为主', '股基利率债为主', '股基信用债为主', '海外债权', '黄金','组合'];
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
        key:'keynote',
        title:'重点基金'
    },
    '🛡️': {
        key:'shield',
        title:'抗跌基金'
    },
    '🏋🏿': {
        key:'heavy',
        title:'重仓基金'
    },
    '💸': {
        key:'dingtou',
        title:'定投基金'
    }
}
const FTYPES = {
    '3':'DQII',
    '1':'股基',
    '2':'债基',
}

const Tools = {
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
    dispatchEvent:($ele,type)=>{
        const event = new Event(type, {
            bubbles: true,
            cancelable: true,
        });
        $ele.dispatchEvent(event);
    },
    getTime:()=>{
        return new Date().toLocaleString();
    },
    getNowDate:()=>{
        // Get current date
        let currentDate = new Date();
        // Get year, month, day, and time
        let year = currentDate.getFullYear();
        let month = currentDate.getMonth() + 1; // January is 0, so we add 1
        let day = currentDate.getDate();
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let seconds = currentDate.getSeconds();

        // Format month, day, hours, minutes, and seconds to always have two digits (e.g., 01, 02, ..., 09)
        if (month < 10) month = '0' + month;
        if (day < 10) day = '0' + day;
        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        if (seconds < 10) seconds = '0' + seconds;
        return {
            start:`${year}-01-01`,
            now:`${year}-${month}-${day}`,
        }
    },
    objectToQueryParams: (params) => {
        return Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    },
    isNumber:(str)=>{
        const num = Number(str);
        return !isNaN(num);
    },
    isNumber1:(str)=>{
        if(!str) return false;
        const num = parseFloat(str);
        if(!isNaN(num) && (num>0 || num<0)){
            return true;
        }
        return false;
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
        const { buy_time } = CODES[code];
        if (!CODES[code].hasOwnProperty('buy_time')) return;
        if (buy_time == '') {
            return Tools.setCustomCodes(code, { income_sort: '' });
        }
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
        localStorage.setItem('jijin.codes', JSON.stringify(CODES));
        // Tools.updateDatasTable();
    },
    delCustomCodes: (code) => {
        delete CODES[code];
        localStorage.setItem('jijin.codes', JSON.stringify(CODES));
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
        // console.log(codes,day,sort);
        codes.sort((a, b) => {
            let result = 0;
            if (day == 'income') {
                let aa = bb = (sort > 0 ? 1000 : 0);
                if (CODES[a.code] && CODES[a.code][day]) aa = CODES[a.code][day];
                if (CODES[b.code] && CODES[b.code][day]) bb = CODES[b.code][day];
                result = aa - bb;
            }else if(day == 'credit'){
                let aa = bb = (sort > 0 ? 0 : 10000);
                if(a.position && +a.position.xx>0) aa = +a.position.xx;
                if(b.position && +b.position.xx>0) bb = +b.position.xx;
                return sort>0?(bb-aa):(aa-bb);
            } else {
                result = a[day] - b[day];
            }
            return sort == 1 ? result : -result;
        })
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
    isDebt:(code)=>{
        const data = DATAS[code];
        let is = 2;//债基
        if(data.Ftype.includes('QDII') || data.Ftype.includes('指数型')){
            is = 3; //QDII
        }else if(data.asset && (+data.asset.gp>0 || +data.asset.jj>0)){
            is = 1;
        }
        return is;
    },
    isSale: (code) => {
        const data = DATAS[code];
        if (!data || !data.maxSaleTime || !CODES[code] || !CODES[code].buy_time) return '';
        const { buy_time } = CODES[code];

        const today = new Date();
        const specificDate = new Date(buy_time);
        const dayDiff = Math.ceil((today.getTime() - specificDate.getTime()) / (1000 * 3600 * 24));
        const day = dayDiff - data.maxSaleTime;
        if (day >= 0) {
            return '<span class="gray">可以售出</span>';
        } else {
            return `<span class="red">还差${-day}天售出</span>`
        }
    },
    updateDatasTable: () => {
        let codes = Object.values(DATAS);
        if (SORT.day && SORT.sort != 0) {
            codes = Tools.sortCodes(codes, SORT.day, SORT.sort);
        }
        Tools.setTable(Tools.getTable(codes));
    },
    storageDatas: () => {
        localStorage.setItem('jijin.datas', JSON.stringify(DATAS));
        localStorage.setItem('jijin.sort', JSON.stringify(SORT));
        localStorage.setItem('jijin.codes', JSON.stringify(CODES));
    },
    // code:基金代码，name:基金名称，dayGrowth：日涨幅，lastWeekGrowth：周涨幅，lastMonthGrowth：月涨幅，lastThreeMonthsGrowth：三月涨幅，lastSixMonthsGrowth：六月涨幅，lastYearGrowth：年涨幅，netWorthDate：净值更新日期，expectWorthDate：净值估算更新日期
    fetch: async (action_name, params) => {
        // console.log(Tools.objectToQueryParams(params));
        const res = await fetch(`http://127.0.0.1:3000/${action_name}?${Tools.objectToQueryParams(params)}`);
        const datas = await res.json();
        return datas;
    },
    getCode: async (code) => {
        // 获取基金名字
        const { SHORTNAME: name, FTYPE: Ftype } = (await Tools.fetch('fundMNDetailInformation', { 'FCODE': code })).Datas;
        // 获取基金涨幅
        const { Datas, Expansion: { TIME: netWorthDate } } = await Tools.fetch('fundMNPeriodIncrease', { 'FCODE': code });
        const Data = { code, name, Ftype, netWorthDate,select_time:Tools.getTime() };
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
        const fundMNHisNetList = await Tools.fetch('fundMNHisNetList', { 'FCODE': code, 'pageIndex': 1, 'pagesize': 4 * 30 });
        let customLastWeekGrowth = 0;
        let custom2LastWeekGrowth = 0;
        let customLastMonthGrowth = 0;
        let dayGrowth = 0;
        fundMNHisNetList.Datas.forEach((data, i) => {
            if (i == 0) dayGrowth = data.JZZZL;
            if(Tools.isNumber(data.JZZZL)){
                // 0,1,2,3   i=3  4-2=2  
                if (i < 5) {
                    customLastWeekGrowth += (+data.JZZZL);
                }
                if (i < 5 * 2) {
                    custom2LastWeekGrowth += (+data.JZZZL);
                }
                if (i < 5 * 4) {
                    customLastMonthGrowth += (+data.JZZZL);
                }
            }          
        })
        // 留下来最近6个月的数据
        Data.dayGrowth = dayGrowth;
        Data.customNetWorkData = fundMNHisNetList.Datas;
        Data.customLastWeekGrowth = (customLastWeekGrowth).toFixed(2);
        Data.custom2LastWeekGrowth = (custom2LastWeekGrowth).toFixed(2);
        Data.customLastMonthGrowth = (customLastMonthGrowth).toFixed(2);
        // 获取基金的持仓情况
        const {data:{fundBondInvestDistri=[],fundAssetAllocationByDate={},expansion,fundInverstPosition={}}} = await Tools.fetch('jjxqy2',{'fcode':code});
        // 资产情况
        Data.asset = {}
        if(fundAssetAllocationByDate && fundAssetAllocationByDate[expansion] && fundAssetAllocationByDate[expansion].length>0){
            const data = fundAssetAllocationByDate[expansion][0];
            Data.asset={
                jj:data.JJ,//基金
                gp:data.GP,//股票
                zq:data.ZQ,//债权
                xj:data.HB,//现金
                qt:data.QT,//其他
            }
        }
        if(fundInverstPosition){
            Data.assetPosition={
                // 基金
                etf:{
                    code:fundInverstPosition.ETFCODE,
                    name:fundInverstPosition.ETFSHORTNAME,
                },
                // 股票
                fundStocks:fundInverstPosition.fundStocks,
                // 债权
                fundboods:fundInverstPosition.fundboods,
            }
            const fundDiff = await Tools.countDp(Data.assetPosition.fundStocks,Data.assetPosition.fundboods);
            Object.assign(Data.assetPosition,fundDiff);
        }
        Data.position={};
        if(fundBondInvestDistri){
            fundBondInvestDistri.forEach(data=>{
                switch (data.BONDTYPENEW) {
                    case '1':
                        // 信用债
                        Data.position.xx=data.PCTNV;
                        break;
                    case '2':
                        // 利率债
                        Data.position.lv=data.PCTNV;
                        break;
                    case '3':
                        // 可转债
                        Data.position.kzz=data.PCTNV;
                        break;
                    case '4':
                        // 其他
                        Data.position.qt=data.PCTNV;
                        break;
                    default:
                        break;
                }
            })
        }
        // 其他基本信息
        const {data:{rateInfo:{sh,MAXSG,CYCLE,SGZT},uniqueInfo}} = await Tools.fetch('jjxqy1_2',{'fcode':code})
        // 卖出时间
        {
            const time = (CYCLE?CYCLE:sh[sh.length-1].time).match(/(\d+)(.+)/);
            if(time){
                if(time[0].includes('天'))Data.maxSaleTime = time[1];
                if(time[0].includes('月'))Data.maxSaleTime = time[1]*30;
                if(time[0].includes('年'))Data.maxSaleTime = time[1]*365;
            }
        }
        // 特色数据
        Data.uniqueInfo = {}
        if(uniqueInfo && uniqueInfo.length>0){
            // 最大回撤
            Data.uniqueInfo.maxretra1 = uniqueInfo[0].MAXRETRA1;
            // 波动率
            Data.uniqueInfo.stddev1 = uniqueInfo[0].STDDEV1;
            // 夏普比率
            Data.uniqueInfo.sharp1 = uniqueInfo[0].SHARP1;
        }
        // 债权组合
        Data.customType = Tools.getCustomType(Data);
        // 是否限额
        Data.maxBuy = MAXSG;
        // 是否可以申购
        Data.sgzt = SGZT;

        console.log(Data);
        Tools.setCode(Data);
        return Data;
    },
    upDateFundDiff:async (code)=>{
        if(!code || !DATAS[code] || !DATAS[code].assetPosition)return;
        const Data = DATAS[code];
        const diff = await Tools.countDp(Data.assetPosition.fundStocks,Data.assetPosition.fundboods);
        Object.assign(Data.assetPosition,diff);
        Tools.storageDatas();
    },
    countDp:async (fundStocks,fundboods)=>{
        // 计算出股票的涨跌
        const fundStocksDiff = {};
        if(fundStocks && fundStocks.length>0){
            const secids = [];
            fundStocks.forEach(fund=>{
                secids.push(`${fund.NEWTEXCH}.${fund.GPDM}`);
            })
            const {data} = await Tools.fetch('ulist',{secids:secids.join(',')});
            if(data && data.diff && data.diff.length>0){
                data.diff.forEach(item=>{
                    fundStocksDiff[item['f12']]=item; 
                })
            }
        }
        // 计算股票的涨幅跟持仓
        let gprice = 0;
        let stockce = 0;
        fundStocks && fundStocks.forEach(data=>{
            stockce +=Number(data['JZBL']);
            if(fundStocksDiff[data.GPDM] && Tools.isNumber(fundStocksDiff[data.GPDM]['f2']) && Tools.isNumber(fundStocksDiff[data.GPDM]['f3'])){
                gprice += ((Number(fundStocksDiff[data.GPDM]['f2']) * Number(fundStocksDiff[data.GPDM]['f3']) * Number(data['JZBL']))/10000)
            }
        })

        // 计算出债权的涨跌
        const fundboodsDiff = {};
        if(fundboods && fundboods.length>0){
            const secids = [];
            fundboods.forEach(fund=>{
                secids.push(`${fund.NEWTEXCH}.${fund.ZQDM}`);
            })
            const {data} = await Tools.fetch('ulist',{secids:secids.join(',')});
            if(data && data.diff && data.diff.length>0){
                data.diff.forEach(item=>{
                    fundboodsDiff[item['f12']]=item; 
                })
            }
        }
        // 计算出债权的涨幅和持仓
        let price = 0;
        let boodce = 0;
        fundboods && fundboods.forEach(data=>{
            boodce += Number(data['ZJZBL']);
            if(fundboodsDiff[data.ZQDM] && Tools.isNumber(fundboodsDiff[data.ZQDM]['f2']) && Tools.isNumber(fundboodsDiff[data.ZQDM]['f3'])){
                price += ((Number(fundboodsDiff[data.ZQDM]['f2']) * Number(fundboodsDiff[data.ZQDM]['f3']) * Number(data['ZJZBL']))/10000)
            }
        })
        return {
            fundStocksDiff,
            fundStocksDp:{
                gprice:gprice.toFixed(4),
                stockce,
            },
            fundboodsDiff,
            fundboodsDp:{
                price:price.toFixed(4),
                boodce
            },
            updateTime:Tools.getTime()
        }
    },
    countInvestment:async (codes,each=()=>{})=>{
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
            for(let weekDtDay of [1,2,3,4,5]){
                const result = await Tools.fetch('fundDtCalculator',{...values,fcode:code,weekDtDay});
                if(result.errorCode==0){
                    let {fcode,...strategy} = values;
                    investment[weekDtDay]={
                        dtPeriods:result.data.dtPeriods,//定投总期数
                        dtSly:result.data.dtSly,//定投收益率%
                        finalTotalAssets:result.data.finalTotalAssets,//期末总资产
                        totalPrincipal:result.data.totalPrincipal,//投入总成本
                        totalSy:result.data.totalSy,//收入多少
                        strategy:strategy,//定投策略
                    }
                }
            }           
            // console.log(result);
            each(investment,`${index}/${codes.length}`);
            Tools.setCustomCodes(code,{investment})
        }
        Tools.updateDatasTable();
    },
    getCustomType:(Data)=>{
        // 基金组合
        let customType = '';
        if(Data.asset){
            if(+Data.asset.gp>0)customType+='股票';
            if(+Data.asset.jj>0)customType+='基金';
            let arr = [];
            Object.keys(Data.position).forEach(position=>{
                if(+Data.position[position]>0)arr.push(position);
            })
            arr=arr.sort((a,b)=>+Data.position[a]<+Data.position[b])
            switch (arr[0]) {
                case 'xx':
                    customType+='信用债';
                    break;
                case 'lv':
                    customType+='利率债';
                    break;
                case 'kzz':
                    customType+='可转债';
                    break;
                case 'qt':
                    customType+='其他';
                    break;
                default:
                    break;
            }
            if(arr.length>1)customType+='为主';
        }
        return customType;
    },
    showYh:(fundboods)=>{
        if(!fundboods && fundboods.length==0)return '';
        let count = 0;
        fundboods.forEach(({ZJZBL,ZQMC,BONDTYPE})=>{
            if((ZQMC.includes('银行二级') || ZQMC.includes('银行永续') || ZQMC.includes('银行CD'))){
                count+=Number(ZJZBL);
            }
        })
        return count;
    },
    addCombinationCode: (codes) => {
        const combination = { code: [], name: [], Ftype: [], netWorthDate: [], dayGrowth: 0, customNetWorkData: [], customLastWeekGrowth: 0, custom2LastWeekGrowth: 0, customLastMonthGrowth: 0,
            lastWeekGrowth:0,lastMonthGrowth:0,lastThreeMonthsGrowth:0,lastSixMonthsGrowth:0,lastYearGrowth:0,
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
        // combination.dayGrowth = (combination.dayGrowth/codes.length).toFixed(2);
        // combination.customLastWeekGrowth = (combination.customLastWeekGrowth/codes.length).toFixed(2);
        // combination.custom2LastWeekGrowth = (combination.custom2LastWeekGrowth/codes.length).toFixed(2);
        // combination.customLastMonthGrowth = (combination.customLastMonthGrowth/codes.length).toFixed(2);
        // combination.lastWeekGrowth = (combination.lastWeekGrowth/codes.length).toFixed(2);
        // combination.lastMonthGrowth = (combination.lastMonthGrowth/codes.length).toFixed(2);
        // combination.lastThreeMonthsGrowth = (combination.lastThreeMonthsGrowth/codes.length).toFixed(2);
        // combination.lastSixMonthsGrowth = (combination.lastSixMonthsGrowth/codes.length).toFixed(2);
        // combination.lastYearGrowth = (combination.lastYearGrowth/codes.length).toFixed(2);

        combination.dayGrowth = (combination.dayGrowth).toFixed(2);
        combination.customLastWeekGrowth = combination.customLastWeekGrowth.toFixed(2);
        combination.custom2LastWeekGrowth = (combination.custom2LastWeekGrowth).toFixed(2);
        combination.customLastMonthGrowth = (combination.customLastMonthGrowth).toFixed(2);
        combination.lastWeekGrowth = (combination.lastWeekGrowth).toFixed(2);
        combination.lastMonthGrowth = (combination.lastMonthGrowth).toFixed(2);
        combination.lastThreeMonthsGrowth = (combination.lastThreeMonthsGrowth).toFixed(2);
        combination.lastSixMonthsGrowth = (combination.lastSixMonthsGrowth).toFixed(2);
        combination.lastYearGrowth = (combination.lastYearGrowth).toFixed(2);

        combination.code = combination.code.join(',');
        // 涨幅列表
        customNetWorkData[0].forEach((ssssss,key)=>{
            let JZZZL = 0;
            for(let i= 0;i<customNetWorkData.length;i++){
                JZZZL+= (+(customNetWorkData[i][key]?customNetWorkData[i][key].JZZZL:0));
            }
            const FSRQ = customNetWorkData[0][key].FSRQ;
            // combination.customNetWorkData.push({JZZZL:(JZZZL/codes.length).toFixed(2),FSRQ})

            combination.customNetWorkData.push({JZZZL:(JZZZL).toFixed(2),FSRQ})
        })
        Tools.setCode(combination);
        // console.log(combination);

    },
    updatasCodes:async ($btn,codes)=>{
        if ($btn.ing != undefined) return;
        $btn.ing = 1;
        const maxLength = codes.length;
        for (let code of codes) {
            // console.log(code);
            $btn.innerHTML = `正在更新${$btn.ing - 0}/${maxLength}`;
            const datas = DATAS[code];
            if (!code.includes(',') && `${new Date(datas.netWorthDate).getMonth()}-${new Date(datas.netWorthDate).getDate()}` != `${new Date().getMonth()}-${new Date().getDate()}`) {
                // console.log(code);
                await Tools.getCode(code);
            }
            $btn.ing++;
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
    getSelCodes:()=>{
        const $trs = $table.querySelectorAll('tr.select');
        const codes = [];
        $trs.forEach($tr => {
            const code = $tr.getAttribute('data-code');
            if(code)codes.push(code);
        })
        return codes;
    },
    getNowCodes:()=>{
        const $trs = $table.querySelectorAll('tr');
        const codes = [];
        $trs.forEach($tr => {
            const code = $tr.getAttribute('data-code');
            if(code)codes.push(code);
        })
        return codes;
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
        datas.forEach((data, index) => {
            // 判断是否更新
            let is_new = false;
            if (new Date().getDate() == new Date(data.netWorthDate).getDate()) {
                is_new = true;
            }
            // 定投收益率
            let dtSly = 0;
            if(CODES[data.code] && CODES[data.code].investment){
                dtSly = (Object.keys(CODES[data.code].investment).map(week=>{
                    return `${(+CODES[data.code].investment[week].dtSly)}`;
                }).reduce((acc, num) => (+acc) + (+num), 0)/5).toFixed(2);
            }
            const emoji_keys = Object.keys(EMOJIS).map(emoji=>EMOJIS[emoji].key);
            // 判断是否有筛选
            // 债券组合筛选
            if ((!SORT.type || (data.customType && data.customType.includes(SORT.type)))) {
                // 基金代码选中筛选
                if (!SORT.checked || (SORT.checked == 1 && CODES[data.code] && CODES[data.code].checked == 1)) {
                    // name筛选/code筛选
                    if (!SORT.name || (data.name.includes(SORT.name) || data.code.includes(SORT.name))) {
                        // note筛选
                        if (!SORT.note || (CODES[data.code] && CODES[data.code].note && CODES[data.code].note.includes(SORT.note))) {
                            // position持仓筛选
                            if(!SORT.position || (data.position && +data.position[SORT.position]>0)){
                                // emoji筛选
                                if (!SORT.emoji || (CODES[data.code] && CODES[data.code][EMOJIS[SORT.emoji].key] == 1)) {
                                    // 针对卖出时间筛选
                                    if (!SORT.sale_time || (data.maxSaleTime == SORT.sale_time)) {
                                        // 针对是否是债基筛选
                                        if(!SORT.Ftype || SORT.Ftype == Tools.isDebt(data.code)){
                                            // 筛选利率债<=
                                            if(!SORT.lv || (data.position && (!data.position.lv || +data.position.lv<=+SORT.lv))){
                                                // 筛选定投收益率
                                                if(!SORT.dtSly || (CODES[data.code] && CODES[data.code].investment && dtSly>=(+SORT.dtSly))){
                                                    str += `
                                                        <tr data-code="${data.code}" style="${data.code.includes(',')?'background: #fff7f3;':''}">
                                                            <td>${index + 1}.<input type="checkbox" class="j-code-checkbox" ${(CODES[data.code] && CODES[data.code].checked == 1) ? 'checked' : ''} /><span class="j-code">${data.code.includes(',')?data.code.replaceAll(',','<br />'):data.code}</span></td>
                                                            <td>
                                                                <span class="j-code-name ${((data.maxBuy && +data.maxBuy<=50000) || (data.sgzt && data.sgzt.includes('暂停'))) ? 'del' : ''}" style="white-space:initial; ">${data.name}${(data.maxBuy && data.maxBuy<=50000)?`/${data.maxBuy}`:''}${(data.sgzt && data.sgzt.includes('暂停'))?`/${data.sgzt}`:''}</span>
                                                                ${is_new ? '<span title="已经更新">🔥</span>' : ''}
                                                                ${CODES[data.code] && Object.keys(EMOJIS).map(emoji=>{
                                                                    return CODES[data.code][EMOJIS[emoji].key]==1?`<span class="j-code-emoji-del" data-emoji="${emoji}" style="" title="${EMOJIS[emoji].title}">${emoji}</span>`:'';
                                                                }).join('') || ''}
                                                            </td>
                                                            <td>${(CODES[data.code] && CODES[data.code].income) ? `<span class="${+CODES[data.code].income > 0 ? `red` : 'green'}">${CODES[data.code].income}%</span>/<span class="brown">${CODES[data.code].income_sort}` : ''}</span></td>
                                                            ${total_arr.map(total => {
                                                        return `<td><span class="${(+data[total[0]]) > 0 ? 'red' : 'green'}">${data[total[0]]}%</span>/<span class="brown">${data[`${total[0]}_sort`]}</span></td>`
                                                    }).join('')}
                                                            <td>${data.customType?data.customType:''}</td>
                                                            <td>${data.maxSaleTime?`${data.maxSaleTime}天免`:''}</td>
                                                            <td>${Tools.isSale(data.code)}</td>
                                                            <td>
                                                                <!-- ${CODES[data.code] && CODES[data.code].credit ? `信用占比${CODES[data.code].credit}%<br />` : ''} -->
                                                                <p class="j-copyText">${CODES[data.code] && CODES[data.code].note ? CODES[data.code].note : ''}</p>
                                                                <p class="fs12 gray j-show-investment">
                                                                    ${CODES[data.code] && CODES[data.code].investment?`
                                                                        定投收益率：${dtSly}%
                                                                    `:''}
                                                                </p>
                                                            </td>
                                                            <td class="j-code-asset-alert" style="font-size:12px; padding:2px 10px; ${data.assetPosition && data.assetPosition.fundStocksDp && (data.assetPosition.fundStocksDp.gprice>0?'background:rgba(255,0,12,.1)':data.assetPosition.fundStocksDp.gprice<0?'background:rgba(0,128,0,.1)':'')}">
                                                                ${data.asset && Tools.isNumber1(data.asset.jj)?`基金：${data.asset.jj}%<br/>`:''}
                                                                ${data.asset && Tools.isNumber1(data.asset.gp)?`股票：${data.asset.gp}%<br/>`:''}
                                                                ${data.asset && Tools.isNumber1(data.asset.zq)?`债权：${data.asset.zq}%<br/>`:''}
                                                                ${data.asset && Tools.isNumber1(data.asset.xj)?`现金：${data.asset.xj}%<br/>`:''}
                                                                ${data.asset && Tools.isNumber1(data.asset.qt)?`其他：${data.asset.qt}%<br/>`:''}
                                                            </td>
                                                            <td class="j-code-asset-alert" style="font-size:12px; padding:2px 10px; ${data.assetPosition && data.assetPosition.fundboodsDp && (data.assetPosition.fundboodsDp.price>0?'background:rgba(255,0,12,.1)':data.assetPosition.fundboodsDp.price<0?'background:rgba(0,128,0,.1)':'')}">
                                                                ${data.position && Tools.isNumber1(data.position.xx)?`信用债：${data.position.xx}%<br/>`:''}
                                                                ${data.position && Tools.isNumber1(data.position.lv)?`利率债：${data.position.lv}%<br/>`:''}
                                                                ${data.position && Tools.isNumber1(data.position.kzz)?`<span class="red">可转债：${data.position.kzz}%</span><br/>`:''}
                                                                ${data.position && Tools.isNumber1(data.position.qt)?`其他：${data.position.qt}%`:''}
                                                            </td>
                                                            <td style="font-size:12px; padding:2px 10px;">
                                                                ${data.uniqueInfo && Tools.isNumber1(data.uniqueInfo.stddev1)?`最大波动：${+data.uniqueInfo.stddev1.toFixed(2)}%<br/>`:''}
                                                                ${data.uniqueInfo && Tools.isNumber1(data.uniqueInfo.sharp1)?`夏普比率：${+data.uniqueInfo.sharp1.toFixed(2)}%<br/>`:''}
                                                                ${data.uniqueInfo && Tools.isNumber1(data.uniqueInfo.maxretra1)?`最大回撤：${+data.uniqueInfo.maxretra1.toFixed(2)}%`:''}
                                                            </td>
                                                            <td class="fs12">
                                                                <input type="date" class="j-code-buy-time" value="${CODES[data.code] && CODES[data.code].buy_time ? CODES[data.code].buy_time : ''}" />
                                                                ${data.assetPosition && data.assetPosition.fundboods && Tools.showYh(data.assetPosition.fundboods)!=0?`<p class="green">银行债：${Tools.showYh(data.assetPosition.fundboods).toFixed(2)}%</p>`:''}
                                                            </td>
                                                            <td>${Array.isArray(data.netWorthDate)?data.netWorthDate.join('<br />'):data.netWorthDate}</td>
                                                            <td style="${data.Ftype.includes('混合型') ? 'color:brown;' : ''}">${Array.isArray(data.Ftype)?data.Ftype.join('<br />'):data.Ftype}</td>
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
                        ${Object.keys(EMOJIS).map(emoji=>{
                            return `<span class="emoji j-emoji ${SORT.emoji == emoji ? 'sel' : ''}">${emoji}</span>`;
                        }).join('')}
                    </th>
                    <th>购后均日涨<span class="caret-wrapper ${SORT.day == 'income' ? sortClassname : ''}" data-day="income"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                    ${total_arr.map(total => {
            return `<th>${total[1]}<span class="caret-wrapper ${SORT.day == total[0] ? sortClassname : ''}" data-day="${total[0]}"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>`
        }).join('')}
                    <th>
                        债权组合
                    </th>
                    <th>卖出时间</th>
                    <th>是否售出</th>
                    <th>备注</th>
                    <th>资产</th>
                    <th>持仓情况<span class="caret-wrapper ${SORT.day == 'credit' ? sortClassname : ''}" data-day="credit"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                    <th>特色数据</th>
                    <th>买入时间</th>
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

        DATAS = localStorage.getItem('jijin.datas') ? JSON.parse(localStorage.getItem('jijin.datas')) : {};
        SORT = localStorage.getItem('jijin.sort') ? JSON.parse(localStorage.getItem('jijin.sort')) : {};
        CODES = localStorage.getItem('jijin.codes') ? JSON.parse(localStorage.getItem('jijin.codes')) : {};

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
                <div class="m-search">
                    <input class="search_input j-code-ipt" type="text" placeholder="债权代码" />
                    <span class="j-code-name gray" style="margin:0 5px;"></span>
                    <button class="search_btn reb j-code-add" style="margin-left:0px">添加债权</button>
                    <button class="search_btn green j-code-combination-add" style="margin-left:10px">添加组合</button>
                    <button class="search_btn j-code-updata" style="margin-left:10px">更新债权</button>
                    <button class="search_btn j-code-combination-updata" style="margin-left:10px">更新组合</button>
                    <button class="search_btn j-code-compare reb" style="margin-left:10px">对比债权</button>
                    <button class="search_btn j-code-download" style="margin-left:10px">下载数据</button>
                    <input class="search_input j-code-note-ipt" type="text" placeholder="备注信息" style="margin-left:10px; width:150px;" />
                    <button class="search_btn reb j-code-note-add" style="margin-left:0px">添加备注</button>
                    <!-- <input class="search_input j-code-credit-ipt" type="text" placeholder="信用占比" style="margin-left:10px;" />
                    <button class="search_btn reb j-code-credit-add" style="margin-left:0px">添加</button> -->
                    <span style="margin-left:10px; color:red;">筛选：</span>
                    ${Object.keys(FTYPES).map(Ftype=>{
                        return `<button class="search_btn j-code-filter-Ftype ${SORT.Ftype==Ftype?'reb':''}" data-ftype="${Ftype}" style="margin-left:10px">${FTYPES[Ftype]}</button>`
                    }).join('')}
                    <input class="search_input j-code-name-ipt" type="text" placeholder="搜索名字/代码" style="margin-left:10px;" value="${SORT.name ? SORT.name : ''}" />
                    <input class="search_input j-code-type-ipt" type="text" placeholder="债权组合" style="margin-left:10px;" value="${SORT.type ? SORT.type : ''}" />
                    <input class="search_input j-code-note-sort" type="text" placeholder="搜索备注" style="margin-left:10px;" value="${SORT.note ? SORT.note : ''}" />
                    <select class="search_input j-code-position-sort" style="margin-left:10px;width:auto;"><option value="">持仓情况</option><option value="kzz" ${SORT.position == 'kzz' ? 'selected' : ''}>可转债</option></select>
                    <select class="search_input j-code-sale_time-sel" style="margin-left:10px;width:auto;"><option value="">选择卖出时间</option>${Object.keys(SALETIME).map(sale_time => (`<option value="${sale_time}" ${SORT.sale_time == sale_time ? 'selected' : ''}>${SALETIME[sale_time]}</option>`)).join('')}</select>
                    <input class="search_input j-code-lv-sort" type="text" placeholder="利率债<=?" style="margin-left:10px;" value="${SORT.lv ? SORT.lv : ''}" />
                    <input class="search_input j-code-dtSly" type="text" placeholder="定投收益率>=?" style="margin-left:10px; width:110px;" value="${SORT.dtSly?SORT.dtSly:''}" />
                    <span style="margin-left:10px; color:red; cursor: pointer;" class="j-code-filter-clear">清楚筛选</span>
                    <span style="margin-left:10px; color:deepskyblue; cursor: pointer;" class="j-code-select-clear">清楚选择</span>
                    <span class="span-a" style="margin-left:10px;">例如：<a class="j-code-note-span">城投</a></span>
                </div>
            </div>
            <div class="m-search">
                定投基金：<input class="search_input mr10" type="text" placeholder="" name="fcode" />
                定投开始日：<input type="date" class="search_input mr10" name="dtStartDate" value="${Tools.getNowDate().start}" />
                定投结束日：<input type="date" class="search_input mr10" name="dtEndDate" value="${Tools.getNowDate().now}" />
                定投周期：每<input class="search_input" type="text" placeholder="" name="round" style="width:35px;" value="1" /><select class="mr10" name="roundType"><option value="1">周</option><!--<option value="2">月</option>--></select>
                定投日：<select class="mr10" name="weekDtDay">${['星期一','星期二','星期三','星期四','星期五'].map((date,index)=>`<option value="${index+1}" ${index==2?'selected':''}>${date}</option>`)}</select>
                每期定投金额：<input class="search_input mr10" type="text" placeholder="" name="dtAmount" value="500" />
                <button class="search_btn reb j-fundDtCalculator">计算</button>
            </div>
            <div style="margin-bottom:10px; color:gray;">选购策略：债权，信用债为主，7天，利率债<15%，最大回撤<0.6，夏普比率>4.8可转债看行情<span class="red j-custom-filter" style="margin-left:10px;">筛选债权</span></div>
            <div class="g-table"></div>
            <div class="g-con"></div>
        `;
        document.querySelector('.content').innerHTML = con;
        // 初始化收入
        // Object.keys(DATAS).forEach(code=>{
        //     Tools.upDateIncome(code);
        // })
        Tools.updateDatasTable();
    }
}
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
        $alert.querySelector('.bg').addEventListener('click', e => {
            $alert.style.display = 'none';
        });
        $body.append($alert);
    }
    show(con,cb) {
        const { $alert } = this;
        const $con = $alert.querySelector('.con');
        $con.innerHTML = con;
        $alert.style.display = 'block';
        $con.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        if(cb) cb(this);
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
// function addEventListener1(el, eventName, eventHandler, selector) {
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

const compareCodes = function (codes) {
    let str = '';
    str += '<div style="display:flex;">';
    let arr = [];
    codes.forEach(code=>{
        arr.push(code);
        if(code.includes(',')){
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
            <div style="text-align:center; margin-bottom:5px; color:gray; position: sticky; top:-20px; background:#fff;word-break:keep-all;">${Array.isArray(name)?'组合':name}</div>
            <table>
                <thead>
                    <tr><th>日期</th><th>日涨幅</th></tr>
                </thead>
                <tbody>
                    ${[...customNetWorkData].map(data => `<tr><td>${data['FSRQ']}</td><td class="${data['JZZZL'] > 0 ? 'red' : 'green'}" style="text-align:right;">${data['JZZZL']}%</td></tr>`).join('')}
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

// 基金名称点击
addEventListener($table, 'click', e => {
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    compareCodes([code]);
}, '.j-code-name')
// 定投点击
addEventListener($table,'click',e=>{
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    const investment=CODES[code].investment;
    let str = '';
    let total={totalPrincipal:0,totalSy:0,dtSly:0};
    Object.keys(investment).forEach(weekDtDay=>{
        total.totalPrincipal+=(+investment[weekDtDay].totalPrincipal);
        total.totalSy+=(+investment[weekDtDay].totalSy);
        total.dtSly+=(+investment[weekDtDay].dtSly);
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
                    <tr><td></td><td>total</td><td>${total.totalPrincipal.toFixed(2)}</td><td>${total.totalSy.toFixed(2)}</td><td>${(total.dtSly/5).toFixed(2)}%</td></tr>
                </tbody>
            </table>
        </div>
        `
    myAlert.show(str);
},'.j-show-investment')
// 持仓情况点击
addEventListener($table,'click',e=>{
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    const Data = DATAS[code];
    if(!Data.assetPosition)return;
    let str = `<div style="text-align:center; margin-bottom:5px; color:gray; position: sticky; top:-20px; background:#fff;word-break:keep-all">${Data.name}${Data.assetPosition.updateTime?`<p style="font-size:12px;">${Data.assetPosition.updateTime}<span class="red j-fundUpdata" style="margin-left:10px;cursor:pointer;">更新</span></p>`:''}</div>`;
    str += '<div style="display:flex;">';
    // 基金情况
    const etf = Data.assetPosition.etf;
    if(+Data.asset.jj>0){
        str+= `
            <div style="margin:0 10px;">
                <table>
                    <thead>
                        <tr><th>基金名称</th><th>持仓占比</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${etf['name']}</td>
                            <td>${Data.asset.jj}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `
    }
    // 股票情况
    const fundStocks = Data.assetPosition.fundStocks;
    const fundStocksDiff = Data.assetPosition.fundStocksDiff;
    const {gprice,stockce}= Data.assetPosition.fundStocksDp;

    if(fundStocks){
        str+= `
            <div style="margin:0 10px;">
                <table>
                    <thead>
                        <tr><th>股票名称</th><th>价格<p class="fs12 fwn ${gprice>0?'red':gprice<0?'green':''}" style="margin-top:-8px;">${gprice}</p></th><th>持仓占比<p class="gray fs12 fwn" style="margin-top:-8px;">${stockce.toFixed(2)}%</p></th></tr>
                    </thead>
                    <tbody>
                        ${fundStocks.map(data => `
                            <tr>
                                <td>${data['GPJC']}</td>
                                <td class="${(fundStocksDiff[data.GPDM] && +fundStocksDiff[data.GPDM]['f3']>0)?'red':(fundStocksDiff[data.GPDM] && +fundStocksDiff[data.GPDM]['f3']<0)?'green':''}">${fundStocksDiff[data.GPDM]?`${fundStocksDiff[data.GPDM]['f2']}/${fundStocksDiff[data.GPDM]['f3']}%`:''}</td>
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
    const {price,boodce} = Data.assetPosition.fundboodsDp;

    if(fundboods){
        str+= `
            <div style="margin:0 10px;">
                <table>
                    <thead>
                        <tr><th>债权名称</th><th>价格${price!=0?`<p class="fs12 fwn ${price>0?'red':price<0?'green':''}" style="margin-top:-8px;">${price}</p>`:''}</th><th>持仓占比<p class="gray fs12 fwn" style="margin-top:-8px;">${boodce.toFixed(2)}%</p></th><th>债权类型</th></tr>
                    </thead>
                    <tbody>
                        ${fundboods.map(data => `<tr><td>${data['ZQMC']}</td><td class="${(fundboodsDiff[data.ZQDM] && +fundboodsDiff[data.ZQDM]['f3']>0)?'red':(fundboodsDiff[data.ZQDM] && +fundboodsDiff[data.ZQDM]['f3']<0)?'green':''}">${fundboodsDiff[data.ZQDM]?`${fundboodsDiff[data.ZQDM]['f2']}/${fundboodsDiff[data.ZQDM]['f3']}%`:''}</td><td>${data['ZJZBL']}%</td><td>${{'1':'信用债','2':'利率债','3':'可转债','4':'其他','5':'同业存单'}[data.BONDTYPE]}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `
    }
    str += '</div>';
    myAlert.show(str,Alert=>{
        // console.log(Alert);
        const $alert = Alert.$alert;
        $alert.querySelector('.j-fundUpdata').addEventListener('click',event=>{
            Tools.upDateFundDiff(Data.code).then(res=>{
                e.target.click();
            })        
        })
    });
},'.j-code-asset-alert')
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
    $codeNameFilter.value= code;
    Tools.dispatchEvent($codeNameFilter,'input');
    // window.location.reload();
    Tools.updateDatasTable();
}, '.j-code-add')
// 添加组合
addEventListener($form,'click', e=>{
    const codes = Tools.getSelCodes();
    if(codes.length>0) Tools.addCombinationCode(codes);
},'.j-code-combination-add')
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
addEventListener($table,'click',e=>{
    const code = e.target.closest('[data-code]').getAttribute('data-code');
    const emoji = e.target.getAttribute('data-emoji');
    // console.log(code)
    if (confirm(`确定取消${EMOJIS[emoji].title}吗?`)) {
        Tools.setCustomCodes(code, { [EMOJIS[emoji].key]: 0 });
        Tools.updateDatasTable();
    }
},'.j-code-emoji-del')
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
    Tools.updatasCodes($btn,Object.keys(DATAS));
}, '.j-code-updata')
// 更新组合
addEventListener($form,'click',e=>{
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
},'.j-code-combination-updata')
// 选择基金代码
addEventListener($table, 'change', e => {
    const $checkbox = e.target;
    const checked = $checkbox.checked;
    const code = $checkbox.closest('tr').getAttribute('data-code');
    // 删掉买入时间，重仓基金
    if (!checked) {
        Tools.setCustomCodes(code, { buy_time: '' });
        Tools.setCustomCodes(code,{heavy:''})
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
// 筛选债权类型
addEventListener($form, 'input', Tools.throttle(e => {
    const type = e.target.value;
    Tools.setCustomSort({ type: type });
}, 500), '.j-code-type-ipt')
// 筛选卖出时间
addEventListener($form, 'change', e => {
    const sale_time = e.target.value;
    Tools.setCustomSort({ sale_time });
}, '.j-code-sale_time-sel')
// 基金买入时间
addEventListener($table, 'change', e => {
    const $buyTime = e.target;
    const buy_time = $buyTime.value;
    const code = $buyTime.closest('tr').getAttribute('data-code');
    Tools.setCustomCodes(code, { buy_time });
    Tools.updateDatasTable();
}, '.j-code-buy-time')
// 筛选名字
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ name: value });
}, 500), '.j-code-name-ipt')
// 筛选债基
addEventListener($form,'click',e=>{
    const $Ftype = e.target;
    if($Ftype.classList.contains('reb')){
        $Ftype.classList.remove('reb');
        Tools.setCustomSort({Ftype:''});
        return;
    }
    const Ftype = $Ftype.getAttribute('data-ftype');
    Tools.setCustomSort({Ftype:Ftype});
    Array.from(document.querySelectorAll('.j-code-filter-Ftype')).filter(ele=>{
        if(ele===$Ftype){
            ele.classList.add('reb');
        }else{
            ele.classList.remove('reb');
        }
    })
},'.j-code-filter-Ftype')
// 筛选备注
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ note: value });
}, 500), '.j-code-note-sort')
addEventListener($form, 'click', Tools.throttle(e => {
    const value = e.target.textContent;
    const $noteSort = document.querySelector('.j-code-note-sort');
    $noteSort.value = value;
    Tools.dispatchEvent($noteSort,'input');
    // Tools.setCustomSort({ note: value });
}, 500), '.j-code-note-span')
// 筛选利率债
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ lv: value });
}, 500), '.j-code-lv-sort')
// 筛选定投收益率
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ dtSly: value });
}, 500), '.j-code-dtSly')
// 筛选持仓
addEventListener($form, 'input', Tools.throttle(e => {
    const value = e.target.value;
    Tools.setCustomSort({ position: value });
}, 500), '.j-code-position-sort')
// 自定义筛选债权
document.querySelector('.j-custom-filter').addEventListener('click',e=>{
    Tools.setCustomSort({
        Ftype:2,//债基
        type:'信用债',//债权类型
        sale_time:'7',//7天卖出时间
        lv:'15',//利率债筛选
    })
    window.location.reload();
})
// 清除筛选
addEventListener($form, 'click', e => {
    delete SORT.type;
    delete SORT.name;
    delete SORT.checked;
    delete SORT.emoji;
    delete SORT.sale_time;
    delete SORT.note;
    delete SORT.position;
    delete SORT.lv;
    delete SORT.dtSly;
    $form.querySelector('.j-code-name-ipt').value = '';
    $form.querySelector('.j-code-type-ipt').value = '';
    $form.querySelector('.j-code-note-sort').value = '';
    $form.querySelector('.j-code-sale_time-sel').value = '';
    $form.querySelector('.j-code-position-sort').value = '';
    $form.querySelector('.j-code-lv-sort').value = '';
    $form.querySelector('.j-code-dtSly').value = '';
    Tools.storageDatas();
    Tools.updateDatasTable();
}, '.j-code-filter-clear')
// 清除选择
addEventListener($form, 'click', e => {
    Tools.updateDatasTable();
}, '.j-code-select-clear')
// 定投计算
document.querySelector('.j-fundDtCalculator').addEventListener('click',async e=>{
    const $parent = e.target.closest('div.m-search');
    const inputsAndSelects = $parent.querySelector('input[name=fcode]');
    const code = inputsAndSelects.value;
    if(!code)return 'fcode不存在';
    if(!DATAS[code])return `DATAS里面不存在${code}`;
    Tools.countInvestment([code]);
    alert('计算成功');
},false)
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
// 对比
addEventListener($table, 'click', e => {
    const $tr = e.target.closest('tr');
    if ($tr.classList.contains('select')) {
        $tr.classList.remove('select')
    } else {
        $tr.classList.add('select');
    }
}, 'tr')
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
        DATAS: JSON.parse(localStorage.getItem('jijin.datas')),
        SORT: JSON.parse(localStorage.getItem('jijin.sort')),
        CODES: JSON.parse(localStorage.getItem('jijin.codes')),
    }
    MDownload([JSON.stringify(data)], '基金数据');
    // console.log(JSON.stringify(data));
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

// 监听右键点击事件
class Contextmenu{
    constructor(){
        const $div = document.createElement('div');
        $div.innerHTML=`
            <style>
                /* 样式化右键菜单 */
                .context-menu {
                    display: none;
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
            <div class="context-menu" style="displqy:none;">
                <div class="name" style="text-align:center;border-bottom:1px solid #e7dfdf;padding:5px;font-size: 14px; color:gray;line-height:1.4;"></div>
                ${Object.keys(EMOJIS).map(emoji=>{
                    return  `<div class="context-menu-item" data-emoji="${emoji}">添加${EMOJIS[emoji].title.substr(0,2)}${emoji}</div>`;
                }).join('')}
                <div class="context-menu-item">更新基金🔃</div>
                <div class="context-menu-item">删除基金🔃</div>
                <div class="context-menu-item">更新定投🔃</div>
                <div class="br"></div>
                <div class="context-menu-item">对比债权❇️</div>
                <div class="context-menu-item">列表基金🔃</div>
                <div class="context-menu-item">列表持仓🔃</div>
                <div class="context-menu-item">列表定投🔃</div>
                <div class="br"></div>
                <div class="context-menu-item">显示代码🔻</div>
                <div style="padding: 10px; font-size:12px;display: flex; justify-content: space-between;"><span style="color:red;cursor: pointer;" class="j-code-filter-clear">清楚筛选</span><span style=" color:deepskyblue; cursor: pointer;" class="j-code-select-clear">清楚选择</span></div>
            </div>
        `
        const $body = document.querySelector('body');
        $body.append($div);
        this.$menu = $div.querySelector('.context-menu');
        this.$name = $div.querySelector('.name');
        // 阻止浏览器默认的右键菜单
        addEventListener($table,'contextmenu',event=>{
            event.preventDefault();
            const $tr = event.target.closest('tr');
            const Data = DATAS[$tr.getAttribute('data-code')];
            this.Data = Data;
            this.$tr = $tr;
            // 显示右键菜单
            this.show(event);
        },'tbody>tr')
        // 取消弹窗
        addEventListener($table,'click',e=>{
            this.hide();
        })
        // 点击菜单
        addEventListener(this.$menu,'click',e=>{
            this.item(e.target);
        },'.context-menu-item')
        this.$menu.querySelector('.j-code-filter-clear').addEventListener('click',e=>{
            $form.querySelector('.j-code-filter-clear').click();
            this.hide();
        })
        this.$menu.querySelector('.j-code-select-clear').addEventListener('click',e=>{
            $form.querySelector('.j-code-select-clear').click();
            this.hide();
        })
    }
    show(event){
        this.$name.innerHTML = `${this.Data.name}`;
        var x = event.clientX + window.scrollX;
        var y = event.clientY + window.scrollY;
        var maxX = window.innerWidth + window.scrollX - this.$menu.offsetWidth-20;
        var maxY = window.innerHeight + window.scrollY - this.$menu.offsetHeight-20;
        x = Math.min(x, maxX);
        y = Math.min(y, maxY);
        this.$menu.style.left = x + "px";
        this.$menu.style.top = y + "px";
        this.$menu.style.display = 'block';
    }
    hide(){
        this.$menu.style.display = 'none';
    }
    async item($item){
        const con = $item.textContent;
        const emoji = $item.getAttribute('data-emoji');
        const Data = this.Data;
        const code = Data.code;
        const _this = this;
        if(emoji){
            Tools.setCustomCodes(code, { [EMOJIS[emoji].key]: 1 });
            Tools.updateDatasTable();
            this.hide();
        }
        if(con.includes('更新基金')){
            // this.$tr.querySelector('.j-code').click();
            // document.querySelector('.j-code-add').click();
            const codes = [code];
            Tools.updatasCodes(document.querySelector('.j-code-updata'),codes);
            this.hide();
        }
        if(con.includes('删除基金')){
            if (confirm('确定删除吗？')) {
                Tools.delCode(code);
            }
            this.hide();
        }
        if(con.includes('更新定投')){
            Tools.countInvestment([code]).then(res=>{
                _this.hide();
            })
        }
        if(con.includes('对比债权')){
            $form.querySelector('.j-code-compare').click();
            this.hide();
        }
        if(con.includes('列表基金')){
            const codes = Tools.getNowCodes();
            Tools.updatasCodes(document.querySelector('.j-code-updata'),codes);
            this.hide();
        }
        if(con.includes('列表持仓')){
            const codes = Tools.getNowCodes();
            const $span = document.createElement('span');
            $span.style = 'color:gray;'
            $item.append($span);
            let index = 0;
            for(let code of codes){
                index++;
                $span.innerHTML=`${index}/${codes.length}`
                await Tools.upDateFundDiff(code);
            }
            $span.remove();
            this.hide();
            Tools.updateDatasTable();
        }
        if(con.includes('列表定投')){
            const codes = Tools.getNowCodes();
            const $span = document.createElement('span');
            $span.style = 'color:gray;'
            $item.append($span);
            Tools.countInvestment(codes,(result,pm)=>{
                $span.innerHTML = pm;
            }).then(res=>{
                $span.remove();
                _this.hide();
            })
        }
        if(con.includes('显示代码')){
            console.log(Data);
            console.log(CODES[Data.code]);
            this.hide();
        }
    }
}
const Menu = new Contextmenu();