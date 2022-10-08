// ==UserScript==
// @name         pdd-good
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://mobile.yangkeduo.com/goods.html*
// @run-at       document-end
// @connect      127.0.0.1
// @require      https://cdn.staticfile.org/jquery/1.12.4/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    const catID = rawData.store.initDataObj.goods.catID;
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
</style>`)[0];
    ajax({
        url: 'http://127.0.0.1:3000/pdd?cat=' + catID,
        callback: res => {
            document.querySelector('head').appendChild(style);
            document
                .querySelector('._1pQOmeOt')
                .appendChild(
                    parseHTML(
                        `<div id="userBox"><ul><li>类目：${res}</li></ul></div>`
                    )[0]
                );
        }
    });
    // Your code here...
})();
