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
// 创建音乐播放器Class
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.volume = 1;
        // 音乐播放完之后自动播放下一首
        this.audio.addEventListener('ended', () => {
            console.log('播放完了');
            if(this.nextMusic)this.nextMusic();
        });
    }
    pause() {
        this.audio.pause(); 
    }
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }
    isPlaying() {
        return !this.audio.paused;
    }
    getCurrentTime() {
        return this.audio.currentTime;
    }
    getDuration() {
        return this.audio.duration;
    }
    setCurrentTime(time) {
        this.audio.currentTime = time;
    }
    play(music) {
        this.audio.src = music;
        this.audio.play();
    }
}
const musicPlayer = new MusicPlayer();

const Tools = {
    data: {
        sel: '语文',
        datas: [],
        $music: null,
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
    // 判断是否音乐文件
    isMusicFile: (ext) => {
        const musicExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
        return musicExtensions.includes(ext);
    },
    findNextSiblingWithClass: (element, className) => {
        let currentElement = element.nextElementSibling;
        while (currentElement) {
            if (currentElement.classList.contains(className)) {
                return currentElement;
            }
            currentElement = currentElement.nextElementSibling;
        }
        return null; 
    },
    findFirstSiblingWithClass: (element, className) => {
        let currentElement = element.previousElementSibling;
        while (currentElement) {
            if (currentElement.classList.contains(className)) {
                return currentElement;
            }
            currentElement = currentElement.previousElementSibling;
        }
        return null;
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
    updataHtml: () => {
        const datas = Tools.data.datas;
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
            // if(Tools.isMusicFile(data.ext)){
            //     return `<li class="music" data-href="/api/dir${url}"><a href="javascript:;">${data.file}</a><span class="bytes">${Tools.formatBytes(data.size)}</span></li>`;
            // }
            return `<li><a target="_black" href="/api/dir${url}">${data.file}</a><span class="bytes">${Tools.formatBytes(data.size)}</span></li>`;
        }).join('')}
            </ul>`
        document.querySelector('.content').innerHTML = str;
    },
    initialization: async () => {
        Tools.addLoading();
        const datas = await Tools.readDir();
        if (datas) {
            Tools.data.datas = datas.datas;
            Tools.updataHtml();
        }
        document.title = QUERY;
        // 顶部的菜单切换
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
            Tools.updataHtml();
        }, '.menu span')
        // 搜索
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
                        ${res.datas.map(data => {
                        let subject = '';
                        if (data.subject) {
                            if (typeof data.subject == 'string') {
                                subject = data.subject;
                            } else {
                                subject = data.subject.text;
                            }
                        }
                        return `
                            <li>${subject ? `<span class="subject" style="${subject == '英语' ? 'color:aquamarine' : ''}">${subject}</span>` : ''}<a ${data.type == 'file' ? 'target="_black"' : ''} href="${data.type === 'file' ? '/api/dir' : ''}?query=${encodeURIComponent(data.file)}&disk=${data.disk}">${Tools.HighlightKeywords(data.file, val.split(' '))}</a>${data.type === 'file' ? `<span class="bytes">${Tools.formatBytes(data.size)}</span>` : ''}</li>
                        `;
                    }).join('')}
                    </ul>`;
                }
            }
        }, '.search-container .search-button')
        addEventListener(document.querySelector('.content'), 'click', (e) => {
            document.querySelector('.search-con').innerHTML = '';
            document.querySelector('.search-container .search-input').value = '';
        }, '.j-search-clear')
        // 音乐播放
        musicPlayer.nextMusic = ()=>{
            const $music = Tools.data.$music;
            if ($music) {
                // 去掉正在播放的图标
                $music.innerHTML = $music.innerHTML.replace('<span class="u-playing">正在播放..</span>', '');
                // 找到下一个音乐元素带class=music的元素
                const $nextMusic = Tools.findNextSiblingWithClass($music, 'music');
                if ($nextMusic) {
                    Tools.data.$music = $nextMusic;
                }else{
                    const $firstMusic = Tools.findFirstSiblingWithClass($music,'music');
                    if ($firstMusic) {
                        Tools.data.$music = $firstMusic;
                    }
                }
                const href = Tools.data.$music.getAttribute('data-href');
                musicPlayer.play(href);
                // 再元素前面加一个正在播放的图标
                Tools.data.$music.innerHTML = `<span class="u-playing">正在播放..</span>${Tools.data.$music.innerHTML}`;
            }
        }
        addEventListener(document.querySelector('.content'), 'click', (e) => {
            const $target = e.target.closest('.music');
            const href = $target.getAttribute('data-href');
            if (href) {
                if (Tools.data.$music) {
                    // 去掉正在播放的图标
                    Tools.data.$music.innerHTML = Tools.data.$music.innerHTML.replace('<span class="u-playing">正在播放..</span>', '');
                    // 如果点击的是正在播放的音乐，停止播放
                    if (Tools.data.$music == $target) {
                        musicPlayer.stop();
                        Tools.data.$music = null;
                        return;
                    }
                }
                musicPlayer.play(href);
                Tools.data.$music = $target;
                e.preventDefault();
                // 再元素前面加一个正在播放的图标
                $target.innerHTML = `<span class="u-playing">正在播放..</span>${$target.innerHTML}`;
            }
        },'.music a')
    }
}
Tools.initialization();