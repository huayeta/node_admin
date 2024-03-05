// https://api.doctorxiong.club/v1/fund?code=007423
// https://api.doctorxiong.club/v1/fund/detail?code=007423

// code:data
let DATAS = {};

const Tools = {
    updateDatasTable: () => {
        Tools.setTable(Tools.getTable(Object.values(DATAS)));
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
        Tools.storageDatas();
        Tools.updateDatasTable();
    },
    setCode: (datas)=>{
        DATAS[datas.code]=datas;
        Tools.storageDatas();
        Tools.updateDatasTable();
    },
    addCode: async (code) => {
        // console.log(code);
        const res = await Tools.fetch(code);
        if (res.code == '200') {
            delete res.data.totalNetWorthData;
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
                    <td>${data.code}</td>
                    <td>${data.name}</td>
                    <td>${data.dayGrowth}%</td>
                    <td>${data.lastWeekGrowth}%</td>
                    <td>${data.lastMonthGrowth}%</td>
                    <td>${data.lastThreeMonthsGrowth}%</td>
                    <td>${data.lastSixMonthsGrowth}%</td>
                    <td>${data.lastYearGrowth}%</td>
                    <td>${data.netWorthDate}</td>
                    <td>${data.expectWorthDate}</td>
                    <td><a style="color:red;" class="j-code-del">删除</a></td>
                </tr>
            `
        });
        return `
        <style>
        .el-table .caret-wrapper {
            display: -webkit-inline-box;
            display: -ms-inline-flexbox;
            display: inline-flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            height: 34px;
            width: 24px;
            vertical-align: middle;
            cursor: pointer;
            overflow: initial;
            position: relative
        }
        
        .el-table .sort-caret {
            width: 0;
            height: 0;
            border: 5px solid transparent;
            position: absolute;
            left: 7px;
            cursor: pointer;
        }
        
        .el-table .sort-caret.ascending {
            border-bottom-color: #c0c4cc;
            top: 5px
        }
        
        .el-table .sort-caret.descending {
            border-top-color: #c0c4cc;
            bottom: 7px
        }
        
        .el-table .ascending .sort-caret.ascending {
            border-bottom-color: #409eff
        }
        
        .el-table .descending .sort-caret.descending {
            border-top-color: #409eff
        }
        </style>
        <table class="el-table">
            <thead>
                <th>基金代码</th>
                <th>基金名称</th>
                <th>日涨幅<span class="caret-wrapper"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                <th>周涨幅<span class="caret-wrapper"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                <th>月涨幅<span class="caret-wrapper"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                <th>3月涨幅<span class="caret-wrapper"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                <th>6月涨幅<span class="caret-wrapper"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                <th>年涨幅<span class="caret-wrapper"><i class="sort-caret ascending"></i><i class="sort-caret descending"></i></span></th>
                <th>净值更新日期</th>
                <th>净值估算更新日期</th>
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
    if ($btn.ing == 1) return;
    $btn.ing = 1;
    $btn.innerHTML = '正在更新';
    for (let code in DATAS) {
        // console.log(code);
        const datas = DATAS[code];
        if (`${new Date(datas.netWorthDate).getMonth()}-${new Date(datas.netWorthDate).getDate()}` != `${new Date().getMonth()}-${new Date().getDate()}`) {
            // console.log(code);
            await Tools.addCode(code);
        }
    }
    $btn.ing = 0;
    $btn.innerHTML = '更新债权';
    Tools.updateDatasTable();
    alert('更新成功');
}, '.j-code-updata')
// 删除代码
addEventListener($table, 'click', e => {
    const target = e.target;
    const $tr = target.closest('tr');
    const code = $tr.getAttribute('data-code');
    Tools.delCode(code);
}, '.j-code-del')
// 排序
addEventListener($table, 'click', e => {
    const target = e.target;
    const $parent = target.parentNode;
    if (target.classList.contains('ascending')) {
        // 点击升序
        if ($parent.classList.contains('ascending')) {
            // 取消升序
            $parent.classList.remove('ascending');
        } else {
            // 升序排列
            $parent.classList.add('ascending');
            $parent.classList.remove('descending');
        }
    }
    if (target.classList.contains('descending')) {
        // 点击降序
        if ($parent.classList.contains('descending')) {
            // 取消降序
            $parent.classList.remove('descending');
        } else {
            // 降序排列
            $parent.classList.add('descending');
            $parent.classList.remove('ascending');
        }
    }
}, '.sort-caret')
