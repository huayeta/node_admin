// ==UserScript==
// @name         pdd-search
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://mobile.yangkeduo.com/search_result.html*
// @run-at       document-end
// @connect      127.0.0.1
// @require      https://cdn.staticfile.org/jquery/1.12.4/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    // console.log(rawData);
    // console.log(rawData.store.data.ssrListData.list);
    // console.log(
    //     JSON.parse(rawData.store.data.ssrListData.list[0].logData.p_search)
    // );
    const ids = [];
    const lists = rawData.store.data.ssrListData.list;
    lists.forEach(item => {
        ids.push(JSON.parse(item.logData.p_search).gin_cat_id_3);
    });
    const ajax = cfg => {
        var request = new XMLHttpRequest();
        request.open('GET', cfg.url, true);

        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                // Success!
                var resp = this.response;
                cfg.callback(resp);
            } else {
                // We reached our target server, but it returned an error
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
            if (cfg.onerror) cfg.onerror();
        };

        request.send();
    };
    var parseHTML = function(str) {
        var tmp = document.implementation.createHTMLDocument();
        tmp.body.innerHTML = str;
        return tmp.body.children;
    };
    const style = parseHTML(`<style>
        #userBox{
            font-size: 14px;
            padding: 15px;
            color: dodgerblue;
            background-color: #f0f0f0;
            margin-top: 15px;
        }
        #userBox li{
            list-style: inside;
        }
        ._1yfk_Hvb,.nN9FTMO2{
            height: 625px;
        }
</style>`)[0];
    let index = -1;
    ajax({
        url: 'http://127.0.0.1:3000/pdd?cat=' + ids.join(','),
        callback: res => {
            document.querySelector('head').appendChild(style);
            const cats = JSON.parse(res);
            // 类目排序
            const sortCats = {};
            cats.forEach((cat, index) => {
                if (sortCats[cat]) {
                    sortCats[cat] += 1;
                } else {
                    sortCats[cat] = 1;
                }
            });
            document
                .querySelector('._2EdaAb7m')
                .insertAdjacentElement(
                    'beforebegin',
                    parseHTML(
                        `<div id="userBox"><ul><li>类目统计（去掉直通车）：${JSON.stringify(
                            sortCats
                        )}</li></ul></div>`
                    )[0]
                );
            // 给每个商品插入类目
            const lists = document.querySelectorAll('._2EdaAb7m>.nN9FTMO2');
            Array.prototype.forEach.call(lists, item => {
                const title = item.querySelector('._1SZEO9z8');
                if (title) {
                    index++;
                    title.appendChild(
                        parseHTML(
                            `<div id="userBox"><ul><li>类目：${cats[index]}</li></ul></div>`
                        )[0]
                    );
                }
            });
        }
    });
    // Your code here...
})();
