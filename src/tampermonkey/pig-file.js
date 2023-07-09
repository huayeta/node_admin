// ==UserScript==
// @name         pig-file.js
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://116.63.136.65/home/member/tb_check.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=136.65
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const open = async ()=>{
        [fileHandle] = await window.showOpenFilePicker();
    }
    document.querySelector('.result_box').addEventListener('click',open,false);
    // Your code here...
})();