// ==UserScript==
// @name         问大家-列表
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  提交完成数据
// @author       You
// @match        https://market.m.taobao.com/app/mtb/questions-and-answers/pages/list/index.html*
// @match        https://web.m.taobao.com/app/mtb/ask-everyone/list*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    const qs = [];
    window.proStart = ()=>{
        const items = document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(2)>div');
        Array.prototype.forEach.call(items,(item)=>{
            const title = item.children[0].innerText;
            qs.push(title)
        })
        console.log(qs.join('\n'))
    }
    const json = {"306291071087":{"title":"请问一下各位买过的朋友这个药对便血效果怎么样","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=306291071087&clusterId=306291071087","id":"306291071087","list":[]},"299122450769":{"title":"这个对内痔和外痔是不是都可以啊？是对肉球很好嘛？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299122450769&clusterId=299122450769","id":"299122450769","list":[]},"301402691459":{"title":"每次排便有异物感，感觉肿胀，用这个刺激不，好不好用？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=301402691459&clusterId=301402691459","id":"301402691459","list":[]},"306505807530":{"title":"请问生完宝宝后肉球一直缩不进去了，用这个会有效果吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=306505807530&clusterId=306505807530","id":"306505807530","list":[]},"302097661052":{"title":"这个药对肉球效果怎么样？用过的真实回答谢谢！","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=302097661052&clusterId=302097661052","id":"302097661052","list":[]},"304512692162":{"title":"七八年的混合痔，有很多肉球，这个能管用吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=304512692162&clusterId=304512692162","id":"304512692162","list":[]},"299120129635":{"title":"效果好不好，脱出来的肉球能缩回去吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299120129635&clusterId=299120129635","id":"299120129635","list":[]},"300181314620":{"title":"各位亲们你们大约用了多久有效果的呀？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300181314620&clusterId=300181314620","id":"300181314620","list":[]},"299024232621":{"title":"这个可以治疗痔疮二期吗？脱出后能塞回去吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299024232621&clusterId=299024232621","id":"299024232621","list":[]},"304964351920":{"title":"这款真的能消肉球吗，会不会复发呀，止痒怎么样","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=304964351920&clusterId=304964351920","id":"304964351920","list":[]},"304427653181":{"title":"各位亲们，真的用么？求回答","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=304427653181&clusterId=304427653181","id":"304427653181","list":[]},"300023433649":{"title":"对便血跟消肉球有用吗？求真是回答","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300023433649&clusterId=300023433649","id":"300023433649","list":[]},"300437955591":{"title":"这个外痔肉球能消吗？有没有副作用","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300437955591&clusterId=300437955591","id":"300437955591","list":[]},"300630631920":{"title":"这个对混合痔有效果吗？能小吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300630631920&clusterId=300630631920","id":"300630631920","list":[]},"298230928927":{"title":"有没有人用这个药，效果怎么样","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=298230928927&clusterId=298230928927","id":"298230928927","list":[]},"299044180917":{"title":"产后得的痔疮，管用吗？可疼那种","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299044180917&clusterId=299044180917","id":"299044180917","list":[]},"299797234946":{"title":"我出血比较多，用这个有好的吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299797234946&clusterId=299797234946","id":"299797234946","list":[]},"299038948574":{"title":"我痔疮比较疼，这个能不能止痛？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299038948574&clusterId=299038948574","id":"299038948574","list":[]},"299490040752":{"title":"请问哺乳期可以用吗？能好吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299490040752&clusterId=299490040752","id":"299490040752","list":[]},"298911172610":{"title":"你们用了多久，肉球消下去的呀？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=298911172610&clusterId=298911172610","id":"298911172610","list":[]},"301309475518":{"title":"时间有点久的肉球用这个好使吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=301309475518&clusterId=301309475518","id":"301309475518","list":[]},"300434891748":{"title":"请问中度痔疮用这个效果好吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300434891748&clusterId=300434891748","id":"300434891748","list":[]},"300444901012":{"title":"用过的，多久可以止住便血啊？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300444901012&clusterId=300444901012","id":"300444901012","list":[]},"298342496972":{"title":"能止痛吗？大便后很痛，肉球痛","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=298342496972&clusterId=298342496972","id":"298342496972","list":[]},"299616715403":{"title":"大便后很痛，一般多久会好啊？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299616715403&clusterId=299616715403","id":"299616715403","list":[]},"300625825450":{"title":"各位用过的，真的能消掉肉球吗","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300625825450&clusterId=300625825450","id":"300625825450","list":[]},"303266528111":{"title":"亲们，求真实反馈，真的有用吗","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=303266528111&clusterId=303266528111","id":"303266528111","list":[]},"305270675394":{"title":"效果真的很好吗，请认真回答","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=305270675394&clusterId=305270675394","id":"305270675394","list":[]},"299602711742":{"title":"这个能断根吗？会不会复发","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299602711742&clusterId=299602711742","id":"299602711742","list":[]},"300313971331":{"title":"产后得的痔疮可以使用吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=300313971331&clusterId=300313971331","id":"300313971331","list":[]},"302251747983":{"title":"亲、真的可以消肉球吗谢谢","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=302251747983&clusterId=302251747983","id":"302251747983","list":[]},"299835617142":{"title":"术后可以用吗？会不会复发哦？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299835617142&clusterId=299835617142","id":"299835617142","list":[]},"305133853750":{"title":"有用吗？坚持用多久呀？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=305133853750&clusterId=305133853750","id":"305133853750","list":[]},"299082218942":{"title":"管用不？会不会复发","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=299082218942&clusterId=299082218942","id":"299082218942","list":[]},"306188754153":{"title":"止血效果如何，能断根吗","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=306188754153&clusterId=306188754153","id":"306188754153","list":[]},"303925656036":{"title":"亲们，真的有用么？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=303925656036&clusterId=303925656036","id":"303925656036","list":[]},"305174739889":{"title":"痔疮真的能消掉啊？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=305174739889&clusterId=305174739889","id":"305174739889","list":[]},"302865656636":{"title":"真的有用吗不忽悠","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=302865656636&clusterId=302865656636","id":"302865656636","list":[]},"306493146718":{"title":"真的可以消肉球吗","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=306493146718&clusterId=306493146718","id":"306493146718","list":[]},"306197105195":{"title":"一个疗程几盒？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=306197105195&clusterId=306197105195","id":"306197105195","list":[]},"306829431237":{"title":"消肉球有效果吗","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=306829431237&clusterId=306829431237","id":"306829431237","list":[]},"304004140494":{"title":"真的有用吗，各位","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=304004140494&clusterId=304004140494","id":"304004140494","list":[]},"309992438510":{"title":"这个对肛裂管用吗？","targetUrl":"https://web.m.taobao.com/app/mtb/ask-everyone/detail?pha=true&disableNav=YES&from=answer&spm=a3134.14087530&id=309992438510&clusterId=309992438510","id":"309992438510","list":[]}}


    let newW;
    const getLoad = (cb,key)=>{
        const items = newW.document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(3)>div:first-child~div');
        if(items.length!== 0) {
            const qs = [];
            Array.prototype.forEach.call(items,(item)=>{
                const title = item.children[1].children[0].innerText;
                qs.push(title);
            })
            return cb(qs,key);
            return new Promise.resolve(items);
        }
        setTimeout(getLoad.bind(this,cb,key),1000);
    }
    const getIems = ()=>{
        const qs = [];
        const items = newW.document.querySelectorAll('.rax-scrollview-webcontainer>div:nth-child(3)>div:first-child~div');
        Array.prototype.forEach.call(items,(item)=>{
            const title = item.children[1].children[0].innerText;
            qs.push(title);
        })
        return qs;
    }
    const QS = {};
    const start = (keys)=>{
        if(keys.length === 0){
            console.log(json);
        }else {
            const key = keys.pop();
            newW.document.location.href = json[key].targetUrl;
            console.log(key)
            setTimeout(()=>{
                getLoad((items,key) => {
                    console.log(key)
                    json[key].list = items;
                    start(keys);
                },key);
            },2000)
        }
    }
    window.pro_start = async ()=>{
        newW = window.open(window.url,"_blank");
        const keys = Object.keys(json);

        start(keys);

    }
    console.log(`pro_start()`);
})();
