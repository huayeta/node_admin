// ==UserScript==
// @name         pdd-admin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://yingxiao.pinduoduo.com/promotion/main/tools/analyze/keyword
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    const Ajax = (url,data)=>{
        var request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
        request.setRequestHeader('anti-content','0apAfa5e-wCEBovdMi9mcXjlrXyaZmHLyRaXxZ4BQuAHqnYIih4ecBmdvf_dBxFIyRe-euAUe-EIyAT-eu_-CNgAHMbcWSswW-bR_zeR7M3cE-eAWSFRWUbaW1fAEUbFvzKRO-KFA7bw_UXkIHuq2YkR4uoAXZkBa-DzbCD-vHkBfZEBwMKBKSeBeHk-vCEBb1EBTEYlgprR2e8tDgxHLtTSkGEnLr1XxmMduNdqY22PaaSD8bbHEfWZPtVCe32OTfToXqgz164qgwpoDBCP4myQ07flLng8NpE7XiEpg60jxQgyYu6P_mqly72QpdblyNpopU03nadWdcCW5YpgjX0Q_n0PJ7CaGpgSUxSOCknZ9G7ZCZ0UQxrCCZhZXtTxSZTRQtPH456w4NGaJ0o4XctU1T1H3V_Io3Zv_3TmXLYX6gGXxKjqJJYn4V8yXiy1tKxpGAy7_-y5DBtmmLQe99qVJtXnUi-2Ci')
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                // Success!
                var resp = this.response;
                console.log(resp);
            } else {
                // We reached our target server, but it returned an error

            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
        };
        request.send(data);
    }
    window.fx = (...args)=>{
        const qs = args[0];
        const qs_arr = qs.split(/[(\r\n)\r\n]+/);
        console.log(qs_arr)
    }
    // Ajax('https://yingxiao.pinduoduo.com/mms-gateway/smartTool/analysis/keyword/queryKeywordTrend',JSON.stringify({"mallId":264536877,"comparedTerm":"","beginDate":"2021-06-06","endDate":"2021-06-12","searchTerm":"口罩"}))
    function _initListenAjax() {
        let self = this;

        function ajaxEventTrigger(event) {
            console.log(event);

            var ajaxEvent = new CustomEvent(event, {
                detail: this
            });
            window.dispatchEvent(ajaxEvent);
        }
        var oldXHR = window.XMLHttpRequest;

        function newXHR() {
            var realXHR = new oldXHR();
            realXHR.addEventListener('load', function ($event) {
                ajaxEventTrigger.call(this, 'ajaxLoad');
                console.log(this);
            }, false);
            realXHR.addEventListener('timeout', function () {
                ajaxEventTrigger.call(this, 'ajaxTimeout');
            }, false);
            realXHR.addEventListener('readystatechange', function () {
                ajaxEventTrigger.call(this, 'ajaxReadyStateChange');
            }, false);
            return realXHR;
        }
        window.XMLHttpRequest = newXHR;
    }
    window.addEventListener("ajaxReadyStateChange", (err) => {
        console.error("ajaxReadyStateChange")
        console.log(err)
    }, true)

    _initListenAjax();


})();