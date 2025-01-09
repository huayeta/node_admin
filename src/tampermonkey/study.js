// 获取网址上面的query参数
const Url = new URL(window.location.href);
const QUERY = Url.searchParams.get('query') ? Url.searchParams.get('query') : '';
const Disk = Url.searchParams.get('disk')? Url.searchParams.get('disk') : '';
const BaseUrl = `${Url.origin}${Url.pathname}`;

function addEventListener(el, eventName, eventHandler, selector) {
    if (selector) {
        const wrappedHandler = (e) => {
            if (!e.target) return;
            // console.log(e.target);
            const el = e.target.closest(selector);
            if (el) {
                // console.log(el);
                eventHandler.call(el, e);
            }
        };
        el.addEventListener(eventName, wrappedHandler);
        return wrappedHandler;
    } else {
        const wrappedHandler = (e) => {
            eventHandler.call(el, e);
        };
        el.addEventListener(eventName, wrappedHandler);
        return wrappedHandler;
    }
}

const Tools = {
    data:{
      sel:null,
      datas:[],
    },
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 2;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    objectToQueryParams: (params) => {
        return Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    },
    fetch: async (query,disk) => {
        // console.log(Tools.objectToQueryParams(params));
        const res = await fetch(`/api/dir?${query ? Tools.objectToQueryParams({ query,disk }) : ''}`);
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
        } else {
            // console.log(res);
            // const blob = await res.blob();
            // const url = URL.createObjectURL(blob);
            // const newWindow = window.open(url, '_self');
            // if (newWindow) {
            //     newWindow.focus();
            // }

        }
        return res;
    },
    readDir: async () => {
        const datas = await Tools.fetch(QUERY,Disk);
        if (datas && datas.code == 0) {
            return datas;
        }
    },
    addLoading: () => {
        document.querySelector('.content').innerHTML = `<div class="loading-container"><span class="loading-spinner"></span><div class="loading-text">正在加载中</div></div>`;
    },
    updataHtml: (datas) => {
        const str = `
            <a href="${BaseUrl}" style="position:fixed;right:1em;bottom:1em;display:block;background:rgba(0,0,0,.2);padding:1em;width:2em;height:2em;border-radius:2em;line-height:2em;text-align:center;color:white;text-decoration:none;">主页</a>
            <h2>${QUERY}</h2>
            ${!QUERY?`<div class="menu">${['语文','数学','英语'].map(data=>`<span ${(Tools.data.sel && Tools.data.sel.includes(data))?'class="sel"':''}>${data}</span>`).join('')}</div>`:''}
            <ul>
                ${datas.map((data) => {
                    if(Tools.data.sel && data.subject && !data.subject.includes(Tools.data.sel))return '';
                    let url = `?query=${encodeURIComponent((QUERY?`${QUERY}\\`:'') + data.file)}&disk=${data.disk}`;
                    if (data.type == "dir") {
                        return `<li>${data.subject?`<span class="subject" style="${data.subject=='英语'?'color:aquamarine':''}">${data.subject}</span>`:''}<a href="${url}">${data.file}</a></li>`;
                    }
                    return `<li><a target="_black" href="/api/dir${url}">${data.file}</a><span class="bytes">${Tools.formatBytes(data.size)}</span></li>`;
        }).join('')}
            </ul>`
        document.querySelector('.content').innerHTML = str;
    },
    initialization: async () => {
        Tools.addLoading();
        const datas = await Tools.readDir();
        if (datas) Tools.updataHtml(datas.datas);
        Tools.data.datas = datas.datas;
        document.title = QUERY;
        addEventListener(document.querySelector('.content'), 'click', (e) => {
            const $target = e.target;
            const sel = $target.textContent;
            if(Tools.data.sel){
                if(Tools.data.sel!==sel){
                    Tools.data.sel = sel;
                }else{
                    Tools.data.sel = null;
                }
            }else{
                Tools.data.sel = sel;
            }
            Tools.updataHtml(Tools.data.datas);
        },'.menu span')
    }
}
Tools.initialization();