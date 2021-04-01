// ==UserScript==
// @name         天猫-提交数据
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        https://trade.taobao.com/trade/itemlist/list_sold_items.htm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    function objToKeyValue(param, key, encode) {
        if (param == null) return '';
        var paramStr = '',t = typeof (param);
        if (t == 'string' || t == 'number' || t == 'boolean') {
            paramStr += '&' + key + '=' + ((encode == null || encode) ? encodeURIComponent(param) : param);
        } else {
            for (var i in param) {
                var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i);
                paramStr += objToKeyValue(param[i], k, encode)
            }
        }
        return paramStr;
    }
    const post = (data,success,error)=>{
        var request = new XMLHttpRequest();
        request.open('POST', 'http://127.0.0.1:3000/api/update-person', true);

        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                // Success!
                var resp = this.response;
                success(JSON.parse(resp));
            } else {
                // We reached our target server, but it returned an error
                error(JSON.parse(this.response));
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
        };
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.send(objToKeyValue(data));
    }
    // 获取列表
    const getItemData = item => {
        // 获取账号
        const account = item.querySelector('a[class^=buyer-mod__name]')
            .innerText;
        // 获取订单号跟创建时间
        const label = item.querySelector('label[class^=item-mod__checkbox-label]').innerText;
        const label_arr = /订单号:\D+?(\d+)创建时间:\D+?(.+)/.exec(label);
        const order_id = label_arr[1].trim();
        const order_create_time = new Date(label_arr[2].trim()).getTime();
        const title = document.querySelector('td[class^=sol-mod__no-br]').textContent.trim();
        let product_id;
        if(title.includes('艾跃痔疮膏去肉球坐浴药凝胶栓外内痔根断正品女性消痔神器混合痔')){
            product_id = 637327644510;
        }
        // 万阁
        const shop_type_txt = document.querySelector('.j_UserNick').innerHTML;
        const shop_type = shop_type_txt.includes('艾跃')?3:shop_type_txt.includes('万阁')?1:2;
        return { shop_type, account, order_id, order_create_time,product_id };
    };
    const Init = ()=>{
        const Items_origin = document.querySelectorAll('.trade-order-main');
        const Items = Array.prototype.filter.call(Items_origin,item=>{
            // 获取旗帜
            const flag = item.querySelector('#flag');
            const flag_style = flag.querySelector('i').getAttribute('style');
            const flag_is_blue = flag_style.includes('-60px -207px');
            if(flag_is_blue){
                // 添加按钮
                const label = item.querySelector('label[class^=item-mod__checkbox-label]');
                const span = document.createElement('span');
                span.innerHTML = '<input placeholder="添加qq" /><button>上传</button><span style="margin-left: 15px" class="msg"></span>';
                const btn = span.querySelector('button');
                const ipt = span.querySelector('input');
                const msg = span.querySelector('.msg');
                btn.addEventListener('click',function (){
                    const value = ipt.value;
                    const data = getItemData(item);
                    data.task_qq = value;
                    post(data,function (res){
                        console.log(res);
                        msg.innerHTML = res.message;
                    },function (){
                        console.log(res);
                        msg.innerHTML = res.message;
                    })
                })
                label.insertAdjacentElement('afterend',span);
            }
            return flag_is_blue;
        });
        const Data = Items.map(getItemData);
        console.log(Data);
        console.log(JSON.stringify(Data));
    }
    Init();
})();
