// 获取网址上面的query参数
const Url = new URL(window.location.href);
const QUERY = Url.searchParams.get('query') ? Url.searchParams.get('query') : '';
const Disk = Url.searchParams.get('disk') ? Url.searchParams.get('disk') : '';
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
    data: {
        sel: '语文',
        datas: [],
    },
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 2;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    HighlightKeywords: (inputString, keywords) => {
        let result = inputString;
        for (let keyword of keywords) {
            // 创建一个不区分大小写的正则表达式，使用 g 标志进行全局匹配
            const regex = new RegExp(keyword, 'gi');
            result = result.replace(regex, `<span style="color:red;">$&</span>`);
        }
        return result;
    },
    objectToQueryParams: (params) => {
        return Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    },
    fetch: async (query, disk) => {
        // console.log(Tools.objectToQueryParams(params));
        const res = await fetch(`/api/dir?${query ? Tools.objectToQueryParams({ query, disk }) : ''}`);
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
    searchFetch: async (search) => {
        const res = await fetch(`/api/dir?search=${search}`);
        return res.json();
    },
    readDir: async () => {
        const datas = await Tools.fetch(QUERY, Disk);
        if (datas && datas.code == 0) {
            return datas;
        }
    },
    addLoading: () => {
        document.querySelector('.content').innerHTML = `<div class="loading-container"><span class="loading-spinner"></span><div class="loading-text">正在加载中，<a href="${BaseUrl}">返回首页</a></div></div>`;
    },
    updataHtml: (datas) => {
        const str = `
            <a href="${BaseUrl}" style="position:fixed;right:1em;bottom:1em;display:block;background:rgba(0,0,0,.2);padding:1em;width:2em;height:2em;border-radius:2em;line-height:2em;text-align:center;color:white;text-decoration:none;">主页</a>
            <h2>${QUERY}</h2>
            ${!QUERY ? `
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="多关键字加空格，例：337晨读 一年级">
                    <button class="search-button">搜索</button>
                </div>
                <div class="search-con"></div>
                <div class="menu">${['语文', '数学', '英语', '历史'].map(data => `<span ${(Tools.data.sel && Tools.data.sel.includes(data)) ? 'class="sel"' : ''}>${data}</span>`).join('')}</div>
            `: ''}
            <ul>
                ${datas.map((data) => {
            let subject = '';
            if (data.subject) {
                if (typeof data.subject == 'string') {
                    subject = data.subject;
                } else {
                    subject = data.subject.text;
                }
            }
            if (Tools.data.sel && subject && !subject.includes(Tools.data.sel)) return '';
            let url = `?query=${encodeURIComponent((QUERY ? `${QUERY}\\` : '') + data.file)}&disk=${data.disk}`;
            if (data.type == "dir") {
                return `<li>${subject ? `<span class="subject" style="${subject == '英语' ? 'color:aquamarine' : ''}">${subject}</span>` : ''}${data.subject && data.subject.is_top == '1' ? `<span class="subject" style="color:#fff;">置顶</span>` : ''}<a href="${url}">${data.file}</a></li>`;
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
            if (Tools.data.sel) {
                if (Tools.data.sel !== sel) {
                    Tools.data.sel = sel;
                } else {
                    Tools.data.sel = null;
                }
            } else {
                Tools.data.sel = sel;
            }
            Tools.updataHtml(Tools.data.datas);
        }, '.menu span')
        addEventListener(document.querySelector('.content'), 'click', async (e) => {
            const $target = e.target;
            const val = document.querySelector('.search-container .search-input').value;
            if (val) {
                $target.disabled = true;
                $target.innerHTML = '搜索中...';
                const res = await Tools.searchFetch(val);
                $target.disabled = false;
                $target.innerHTML = '搜索';
                if (res.code == 0) {
                    document.querySelector('.search-con').innerHTML = `<div style="text-align:center;font-size:12px;color:gray;">搜索结果${res.datas.length}个，<span style="color:red;" class="j-search-clear">点击清楚结果</span></div><ul>
                        ${res.datas.map(data => `
                            <li><a ${data.type == 'file' ? 'target="_black"' : ''} href="${data.type === 'file' ? '/api/dir' : ''}?query=${encodeURIComponent(data.file)}&disk=${data.disk}">${Tools.HighlightKeywords(data.file,val.split(' '))}</a>${data.type === 'file' ? `<span class="bytes">${Tools.formatBytes(data.size)}</span>` : ''}</li>
                        `).join('')}
                    </ul>`;
                }
            }
        }, '.search-container .search-button')
        addEventListener(document.querySelector('.content'), 'click', (e) => {
            document.querySelector('.search-con').innerHTML = '';
            document.querySelector('.search-container .search-input').value = '';
        }, '.j-search-clear')
    }
}
Tools.initialization();