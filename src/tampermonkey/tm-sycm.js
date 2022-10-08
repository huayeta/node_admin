// ==UserScript==
// @name         生意参谋
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  交易指数转换
// @author       You
// @match        https://sycm.taobao.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 重写pushState与replaceState事件函数
    var _wr = function(type) {
        // 记录原生事件
        var orig = history[type];
        return function() {
            // 触发原生事件
            var rv = orig.apply(this, arguments);
            // 自定义事件
            var e = new Event(type);
            e.arguments = arguments;
            // 触发自定义事件
            window.dispatchEvent(e);
            return rv;
        };
    };

    // 调用重写
    history.replaceState = _wr('replaceState');
    let Index = 0;
    const zhZs = str => {
        const ths = document.querySelectorAll('.ant-table-body thead tr th');
        let jyzsIndex = -1;
        [].slice.call(ths).forEach((th, index) => {
            // console.log(th.innerText.trim());
            if (th.innerText.trim() === str) jyzsIndex = index;
        });
        if (jyzsIndex === -1) return;
        const tds = document.querySelectorAll(
            `.ant-table-body tbody tr td:nth-child(${jyzsIndex + 1})`
        );
        const tdTexts = [].slice
            .call(tds)
            .map(td => td.innerText.replace(',', ''));
        console.log(tdTexts);
        fetch(`http://127.0.0.1/sycm?jyzs=${tdTexts.join(',')}`)
            .then(res => res.json())
            .then(res => {
                [].slice.call(tds).forEach((td, index) => {
                    const val = td.querySelector(
                        '.alife-dt-card-common-table-sortable-value'
                    );
                    const text = val.innerHTML;
                    val.innerHTML = `${text}<span data-sz="1" style="color: red;">,${res[index]}</span>`;
                });
            });
    };
    window.addEventListener('replaceState', () => {
        console.log(location.href);
        if (Index !== 0) return;
        const href = location.href;
        if (href.includes('search_analyze?activeKey=relation')) {
            Index++;
            const tt = document.querySelector(
                '.oui-card-header-item.oui-card-header-item-pull-left'
            );
            const ele = document.createElement('div');
            ele.innerHTML =
                '<a style="color: red; user-select: none;" data-type="交易指数">分析交易额</a><a style="color: red; margin-left: 15px; user-select: none;" data-type="搜索人气">分析搜索人气</a><a style="color: red; margin-left: 15px; user-select: none;" data-type="搜索人气|交易指数">一键转换</a><a style="color: rebeccapurple; margin-left: 15px; user-select: none;" class="clear">一键清理</a>';
            const btns = ele.querySelectorAll('[data-type]');
            [].slice.call(btns).forEach(btn => {
                btn.addEventListener('click', function() {
                    const type = this.getAttribute('data-type');
                    if (!type.includes('|')) {
                        zhZs(type);
                    } else {
                        const arr = type.split('|');
                        arr.forEach(ty => zhZs(ty));
                    }
                });
            });
            ele.querySelector('.clear').addEventListener('click', function() {
                const tds = document.querySelectorAll(
                    '.ant-table-body tbody tr td'
                );
                [].slice.call(tds).forEach(td => {
                    const val = td.querySelector(
                        '.alife-dt-card-common-table-sortable-value'
                    );
                    if (!val) return;
                    const text = val.innerHTML;
                    const exec = text.match(/(.+?)<span data-sz="1"/);
                    // console.log(exec);
                    if (exec) {
                        val.innerText = exec[1];
                    }
                });
            });
            tt.appendChild(ele);
        } else {
            Index = 0;
        }
    });
    // Your code here...
})();
