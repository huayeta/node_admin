// https://api.doctorxiong.club/v1/fund?code=007423
// https://api.doctorxiong.club/v1/fund/detail?code=007423

// code:data
let DATAS = {};
// {day:total_arr[0],sort:-1|1|0}
let SORT = {};
// {code:{checked:1,type:code_type_arr[0]}}
let CODES = {};
const total_arr = [['dayGrowth', '日涨幅'], ['customLastWeekGrowth', '最近周涨幅'],['custom2LastWeekGrowth', '最近2周涨幅'], ['customLastMonthGrowth', '最近月涨幅'],  ['lastMonthGrowth', '月涨幅'], ['lastWeekGrowth', '周涨幅'], ['lastThreeMonthsGrowth', '3月涨幅'], ['lastSixMonthsGrowth', '6月涨幅'], ['lastYearGrowth', '年涨幅']];
const code_type_arr = ['利率债','信用债','利率债为主','信用债为主','股基利率债为主']

const Tools = {
    setCustomCodes:(code,obj)=>{
        if(!CODES[code])CODES[code]={};
        Object.assign(CODES[code],obj);
        localStorage.setItem('jijin.codes', JSON.stringify(CODES));
        // Tools.updateDatasTable();
    },
    delCustomCodes:(code)=>{
        delete CODES[code];
        localStorage.setItem('jijin.codes', JSON.stringify(CODES));
    },
    // 1 升序 -1 降序
    setSort: ({ day, sort }) => {
        SORT = { day, sort };
        localStorage.setItem('jijin.sort', JSON.stringify(SORT));
        // console.log(SORT);
        Tools.updateDatasTable();
    },
    sortCodes:(codes,day,sort)=>{
        codes.sort((a, b) => {
            const result = a[day] - b[day];
            return sort == 1 ? result : -result;
        })
        return codes;
    },
    sortHtml:(day)=>{
        let codes = Object.values(DATAS);
        codes = Tools.sortCodes(codes,day,-1);
        for (let key in codes) {
            const code = codes[key].code;
            // console.log(Number(key)+1);
            DATAS[code][`${day}_sort`] = `<span style="${key < 5 ? 'color:deepskyblue;' : ''}">${Number(key) + 1}</span>/${codes.length}`;
        }
    },
    updateDatasTable: () => {
        let codes = Object.values(DATAS);
        if (SORT.day && SORT.sort != 0) {
            codes=Tools.sortCodes(codes,SORT.day, SORT.sort);
        }
        Tools.setTable(Tools.getTable(codes));
    },
    storageDatas: () => {
        localStorage.setItem('jijin.datas', JSON.stringify(DATAS));
    },
    // code:基金代码，name:基金名称，dayGrowth：日涨幅，lastWeekGrowth：周涨幅，lastMonthGrowth：月涨幅，lastThreeMonthsGrowth：三月涨幅，lastSixMonthsGrowth：六月涨幅，lastYearGrowth：年涨幅，netWorthDate：净值更新日期，expectWorthDate：净值估算更新日期
    fetch: async (code) => {
        const res = await fetch(`https://api.doctorxiong.club/v1/fund/detail?code=${code}`);
        const datas = await res.json();
        return datas;
    },
    delCode: (code) => {
        delete DATAS[code];
        // 排序
        total_arr.forEach(total => {
            Tools.sortHtml(total[0]);
        })
        Tools.delCustomCodes(code);
        Tools.storageDatas();
        Tools.updateDatasTable();
    },
    setCode: (datas) => {
        DATAS[datas.code] = datas;
        // 排序
        total_arr.forEach(total => {
            Tools.sortHtml(total[0]);
        })
        // Tools.delCustomCodes(datas.code);
        Tools.storageDatas();
        Tools.updateDatasTable();
    },
    addCode: async (code) => {
        // console.log(code);
        const res = await Tools.fetch(code);
        if (res.code == '200') {
            const { netWorthData } = res.data;
            const maxLength = netWorthData.length;
            let customLastWeekGrowth = 0;
            let custom2LastWeekGrowth = 0;
            let customLastMonthGrowth = 0;
            // 0,1,2,3   i=3  4-2=2  
            for (let i = maxLength - 1; i > 0; i--) {
                if (i >= maxLength - 5) {
                    customLastWeekGrowth += (+netWorthData[i][2]);
                }
                if (i >= maxLength - 5 * 2) {
                    custom2LastWeekGrowth += (+netWorthData[i][2]);
                }
                if (i >= maxLength - 5 * 4) {
                    customLastMonthGrowth += (+netWorthData[i][2]);
                }
            }
            res.data.customLastWeekGrowth = (customLastWeekGrowth).toFixed(2);
            res.data.custom2LastWeekGrowth = (custom2LastWeekGrowth).toFixed(2);
            res.data.customLastMonthGrowth = (customLastMonthGrowth).toFixed(2);
            delete res.data.totalNetWorthData;
            delete res.data.netWorthData;
            Tools.setCode(res.data);
            return res.data;
        }
        return false;
    },
    getTable: (datas = []) => {
        let str = '';
        datas.forEach(data => {
            str += `
                <tr data-code="${data.code}">
                    <td><input type="checkbox" class="j-code-checkbox" ${(CODES[data.code] && CODES[data.code].checked==1)?'checked':''} />${data.code}</td>
                    <td>${data.name}</td>
                    ${total_arr.map(total => {
                return `<td><span class="${(+data[total[0]])>0?'red':'green'}">${data[total[0]]}%</span>/<span class="brown">${data[`${total[0]}_sort`]}</span></td>`
            }).join('')}
                    <td>${data.netWorthDate}</td>
                    <td style="${data.type=='混合型'?'color:brown;':''}">${data.type}</td>
                    <td><select class="j-code-type"><option></option>${code_type_arr.map(type=>`<option ${(CODES[data.code] && CODES[data.code].type==type)?'selected':''}>${type}</option>`).join('')}</select></td>
                    <td><a style="color:red;" class="j-code-del">删除</a></td>
                </tr>
            `
        });
        // 判断排序class
        let sortClassname = '';
        if (SORT.sort == 1) sortClassname = 'ascending';
        if (SORT.sort == -1) sortClassname = 'descending';
        return `
        <table class="el-table">
            <thead>
                <th>基金代码</th>
                <th>基金名称</th>
                ${total_arr.map(total => {
            return `<th>${total[1]}<span class="caret-wrapper ${SORT.day == total[0] ? sortClassname : ''}" data-day="${total[0]}"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>`
        }).join('')}
                <th>净值更新日期</th>
                <th>债权类型</th>
                <th>债权组合</th>
                <th>操作</th>
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
        const con = `
            <div class="g-form">
                <style>
                    .m-search{
                        display:flex; align-items:center; height:auto; margin-bottom:15px;
                    }
                    .m-search .search_input{width:150px;}
                </style>
                <div class="m-search">
                    <input class="search_input j-code-ipt" type="text" data-key="wx" placeholder="债权代码" />
                    <button class="search_btn reb j-code-add" style="margin-left:10px">添加债权</button>
                    <button class="search_btn j-code-updata" style="margin-left:10px">更新债权</button>
                </div>
            </div>
            <div class="g-table"></div>
            <div class="g-con"></div>
        `;
        document.querySelector('.content').innerHTML = con;
        DATAS = localStorage.getItem('jijin.datas') ? JSON.parse(localStorage.getItem('jijin.datas')) : {};
        SORT = localStorage.getItem('jijin.sort') ? JSON.parse(localStorage.getItem('jijin.sort')) : {};
        CODES = localStorage.getItem('jijin.codes') ? JSON.parse(localStorage.getItem('jijin.codes')) : {};
        Tools.updateDatasTable();
    }
}
// 初始化
Tools.initialization();
// Tools.fetch('007423,007424').then(res=>{
//     if(res.code=='200'){
//         const str = Tools.getTable(res.data);
//         Tools.setTable(str)
//     }
// })
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
const $Content = document.querySelector('.content');
const $form = $Content.querySelector('.g-form');
const $table = $Content.querySelector('.g-table');
const $codeIpt = $form.querySelector('.j-code-ipt');

// 添加代码
addEventListener($form, 'click', async e => {
    const $btn = e.target;
    if ($btn.ing == 1) return;
    $btn.ing = 1;
    $btn.innerHTML = '正在添加';
    const code = $codeIpt.value;
    const res = await Tools.addCode(code);
    if (res) {
        // alert('添加成功');
        Tools.updateDatasTable();
        $codeIpt.value = '';
    } else {
        alert('添加失败');
    }
    $btn.ing = 0;
    $btn.innerHTML = '添加债权';
}, '.j-code-add')
// 更新债权
addEventListener($form, 'click', async e => {
    const $btn = e.target;
    if ($btn.ing!=undefined) return;
    $btn.ing = 1;
    const maxLength = Object.keys(DATAS).length;
    for (let code in DATAS) {
        // console.log(code);
        $btn.innerHTML = `正在更新${$btn.ing-0}/${maxLength}`;
        const datas = DATAS[code];
        if (`${new Date(datas.netWorthDate).getMonth()}-${new Date(datas.netWorthDate).getDate()}` != `${new Date().getMonth()}-${new Date().getDate()}`) {
            // console.log(code);
            await Tools.addCode(code);
            $btn.ing++;
        }
    }
    $btn.ing = undefined;
    $btn.innerHTML = '更新债权';
    Tools.updateDatasTable();
    alert('更新成功');
}, '.j-code-updata')
// 选择基金代码
addEventListener($table,'change',e=>{
    const $checkbox = e.target;
    const checked = $checkbox.checked;
    const code = $checkbox.closest('tr').getAttribute('data-code');
    Tools.setCustomCodes(code,{checked:checked?1:0});
},'.j-code-checkbox')
// 选择基本类型
addEventListener($table,'change',e=>{
    const $select = e.target;
    const selected = $select.value;
    const code = $select.closest('tr').getAttribute('data-code');
    Tools.setCustomCodes(code,{type:selected});
},'.j-code-type')
// 删除代码
addEventListener($table, 'click', e => {
    if (confirm('确定删除吗？')) {
        const target = e.target;
        const $tr = target.closest('tr');
        const code = $tr.getAttribute('data-code');
        Tools.delCode(code);
    }
}, '.j-code-del')
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
// addEventListener($table,'click',e=>{
//     const $tr = e.target;
//     console.log($tr);
//     if($tr.classList.contains('select')){
//         $tr.classList.remove('select')
//     }else{
//         $tr.classList.add('select');
//     }
// },'[data-code]')
