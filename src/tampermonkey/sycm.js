// ==UserScript==
// @name         生意参谋参数转化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  生意参谋参数转化，配合店透视
// @author       You
// @match        https://sycm.taobao.com/mc/mq/search_analyze?*
// @grant        none
// ==/UserScript==

// 店透视参数转化：https://www.diantoushi.com/batch_change_percent.html

(function () {
    'use strict';
    // Your code here...
    // tradeIndex：tradeIndexChange交易指数 tradeIndex2：tradeIndex2Change交易指数2（交易件数）uvIndex：uvIndexChange流量指数 payRateIndex：payRateIndexChange'0.03%'支付转化指数 payByrCntIndex：payByrCntIndexChange客群指数 seIpvUvHits：seIpvUvHitsChange搜索人气 cartHits：cartHitsChange加购人气 cltHits：cltHitsChange收藏人气
    // 这里面只有支付转化指数不一样payRateIndex：payRateIndexChange
    const myFetch = (number, cb,type='tradeIndex',typeChage='tradeIndexChange') => {
        const url = 'https://www.diantoushi.com/switch/v2/change';
        const data = {
            "categoryId": "",
            "changeType": "2",
            "indexTrans": "[{\"num\":1,\""+type+"\":\"" + number + "\"}]"
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
                const result = data.data[0][typeChage];
                // alert(result);
                cb(result);
            })
            .catch(error => {
                console.error('请求出错：', error);
            });
    }
    // myFetch(22311);
    // 找到对应的index
    function getIndex(el,text) {
        // 获取所有 th 元素
        var thElements = el.getElementsByTagName('th');
        let index = -1;
        // 循环遍历 th 元素
        for (var i = 0; i < thElements.length; i++) {
            // 检查 th 元素的文本内容是否包含text
            // console.log(thElements[i].textContent);
            if (thElements[i].textContent.includes(text)) {
                index = i;
                break;
            }
        }
        return index;
    }
    // 建立菜单
    function createMenu() {
        const $menu = document.createElement('div');
        $menu.className = 'm-my-menu';
        $menu.innerHTML = `
        <style>
            .m-my-menu{
                position:fixed;
                right:20px;
                top:9%;
                z-index:10000000000;
                font-size:18px;
            }
        </style>
        <ul>
            <li><a class="live">更新指数参数</a><li>
        </ul>
        `;
        document.body.appendChild($menu);
        return $menu;
    }
    const $menu = createMenu();
    const $liveMenu = $menu.querySelector('.live');
    $liveMenu.addEventListener('click', () => {
        document.querySelectorAll('.el-table__body-wrapper').forEach($e=>{
            $e.style.height='auto';
        })

        const $tables = document.querySelectorAll('.el-table');
        $tables.forEach($table=>{
            const $header = $table.querySelector('.el-table__header');
            if(!$header) return;
            const ss_index = getIndex($header,'搜索人气');
            const rq_index = getIndex($header,'点击人气');
            const jy_index = getIndex($header,'交易指数');
            const zh_index = getIndex($header,'支付转化指数');
            const zxsp_index = getIndex($header,'在线商品数');
            // alert(jy_index);
            if(jy_index==-1)return;
            const $body = $table.querySelector('.el-table__body');
            // console.log($body);
            // alert('1111111')
            if(!$body)return;
            const $trs = $body.querySelectorAll('.el-table__row');
            // alert($trs.length);
            $trs.forEach(($tr, index) => {
                if($tr.getAttribute('get-data'))return;
                $tr.setAttribute('get-data','1');
                // 交易金额
                const jy = $tr.querySelector(`td:nth-child(${jy_index+1})`);
                // 转换交易金额指数
                myFetch(jy.textContent, jy_res => {
                    // 计算出具体的支付人数
                    // const num = (parseFloat(rs) * parseFloat(zh.textContent.replace("%", "")) / 100).toFixed(0);
                    // // 计算商品竞争度
                    // const jzd = (zxsp/ssrs*100).toFixed(2);

                    const $span = document.createElement('span');
                    $span.className = 'bao';
                    $span.style = 'color:red;display:block;white-space: nowrap;';
                    $span.innerHTML = `<p>交易金额：${jy_res}</p>`;
                    jy.style.overflow ='visible';
                    const $jyCell = jy.querySelector('.cell');
                    $jyCell.style.overflow='visible';
                    jy.querySelector('.cell').appendChild($span);

                    // 搜索的人
                    if(ss_index==-1)return;
                    const ss = $tr.querySelector(`td:nth-child(${ss_index+1})`);
                    // 转换搜索人数指数
                    myFetch(ss.textContent, ss_res => {
                        const $ssSpan = document.createElement('span');
                        $ssSpan.style = 'color:red;display:block;white-space: nowrap;';
                        $ssSpan.textContent = `搜索人数：${ss_res}`;
                        ss.querySelector('.cell').appendChild($ssSpan);

                        // 点击人数
                        if(rq_index==-1)return;
                        const rq = $tr.querySelector(`td:nth-child(${rq_index+1})`);
                        // 转换点击人数指数
                        myFetch(rq.textContent, rq_res => {
                            const $rqSpan = document.createElement('span');
                            $rqSpan.style = 'color:red;display:block;white-space: nowrap;';
                            $rqSpan.textContent = `点进来人：${rq_res}`;
                            rq.querySelector('.cell').appendChild($rqSpan);

                            if(zh_index===-1 || zxsp_index ===-1)return;
                            //支付转化率
                            const zh = $tr.querySelector(`td:nth-child(${zh_index+1})`);
                            // 在线商品数
                            const zxsp = $tr.querySelector(`td:nth-child(${zxsp_index+1})`).textContent.replace(/,/g, '');
                            // 计算出具体的支付人数
                            const num = (parseFloat(rq_res) * parseFloat(zh.textContent.replace("%", "")) / 100).toFixed(0);
                            // 计算商品竞争度
                            const jzd = (zxsp/ss_res*100).toFixed(2);
                            $span.innerHTML+=`<p>支付人数：${num}</p><p>商品竞争度：${jzd}</p>`;
                        })  
                    })
                })
            })
        })
    }, false)
})();
