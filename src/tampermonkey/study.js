// 获取网址上面的query参数
const Url = new URL(window.location.href);
const QUERY = Url.searchParams.get('query') ? Url.searchParams.get('query') : '';
const Disk = Url.searchParams.get('disk') ? Url.searchParams.get('disk') : '';
const Musice = Url.searchParams.get('musice') ? Url.searchParams.get('musice') : '';
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
            <a href="${BaseUrl}" class="bottom-right-button">主页</a>
            <h2>${QUERY}</h2>
            ${!QUERY ? `
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="多关键字加空格，例：337晨读 一年级">
                    <button class="search-button">搜索</button>
                </div>
                <div class="search-con"></div>
                <div class="menu">${['语文', '数学', '英语', '阅读', '历史', '初中', '高中', '其他'].map(data => `<span ${(Tools.data.sel && Tools.data.sel.includes(data)) ? 'class="sel"' : ''}>${data}</span>`).join('')}</div>
            `: ''}
            <ul>
                ${datas.map((data,index) => {
            let subject = '';
            if (data.subject) {
                if (typeof data.subject == 'string') {
                    subject = data.subject;
                } else {
                    subject = data.subject.text;
                }
            }
            // 容差小学
            // if(subject && subject.includes('小学'))subject+=' 语文 数学 英语';
            if (Tools.data.sel && subject && !subject.includes(Tools.data.sel)) {
                if (subject.includes('小学') && (Tools.data.sel == '语文' || Tools.data.sel == '数学' || Tools.data.sel == '英语')) {

                } else {
                    return '';
                }
            }
            let url = `?query=${encodeURIComponent((QUERY ? `${QUERY}\\` : '') + data.file)}&disk=${data.disk}`;
            if (data.type == "dir") {
                return `<li>${subject ? `<span class="subject" style="${subject == '英语' ? 'color:aquamarine' : ''}">${subject}</span>` : ''}${data.subject && data.subject.is_top == '1' ? `<span class="subject" style="color:#fff;">置顶</span>` : ''}<a href="${url}">${data.file}</a></li>`;
            }
            if (Tools.isMusicFile(data.ext)) {
                const urlMusic = new URL(window.location.href);
                urlMusic.searchParams.set('musice', index);
                return `<li><a target="_black" href="${urlMusic.toString()}">${data.file}</a><span class="bytes">${Tools.formatBytes(data.size)}</span></li>`;
            }
            return `<li><a target="_black" href="/api/dir${url}">${data.file}</a><span class="bytes">${Tools.formatBytes(data.size)}</span></li>`;
        }).join('')}
            </ul>`
        document.querySelector('.content').innerHTML = str;
    },
    playMusic: async () => {
        const { MYPlayer } = await import('./study-player.js');
        const myPlayer = new MYPlayer();
        // 找到所有音频文件
        const files = Tools.data.datas.filter(data => {
            return Tools.isMusicFile(data.ext);
        }).map(file => {
            return {
                title: file.file,
                file: `/api/dir?query=${encodeURIComponent((QUERY ? `${QUERY}\\` : '') + file.file)}&disk=${file.disk}`,
            }
        })
        // console.log(files)
        await myPlayer.init(files, '.content');
        // console.log(myPlayer.player.skipTo)
        myPlayer.player.skipTo(+Musice); 
    },
    initialization: async () => {
        // const aa = import('./study-player.js');
        // 如果query的后缀名是.pdf
        if (QUERY && QUERY.endsWith('.pdf')) {
            const pdfjs = await import('https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.min.mjs');
            // 初始化PDF.js库 
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
            // 加载PDF文件
            let url = `?query=${encodeURIComponent(QUERY)}&disk=${Disk}`;
            // const response = await fetch(`/api/dir${url}`);
            // console.log(response instanceof ReadableStream)
            // const blob = await response.blob();

            // const reader = new FileReader();
            // reader.onload = function (e) {
            //     console.log(e.target)
            //     const pdfData = e.target.result;
            //     pdfjs.getDocument(pdfData).promise.then(function (pdfDoc) {
            //         console.log(pdfDoc)
            //         const container = document.querySelector('.content');
            //         pdfDoc.getPage(2).then(function (page) {
            //             const viewport = page.getViewport({ scale: 1 });
            //             const canvas = document.createElement('canvas');
            //             canvas.width = viewport.width;
            //             canvas.height = viewport.height;
            //             container.appendChild(canvas);
            //             const renderContext = {
            //                 canvasContext: canvas.getContext('2d'),
            //                 viewport: viewport
            //             };
            //             page.render(renderContext);
            //         });
            //     });
            // };
            // reader.readAsArrayBuffer(blob);
            var loadingTask = pdfjs.getDocument({
                url: `/api/dir${url}`,
                // 开启流式加载
                disableAutoFetch: false,
                // 分块加载大小，可根据实际情况调整
                rangeChunkSize: 65536
            });
            loadingTask.promise.then(function (pdf) {
                console.log('PDF loaded');

                // Fetch the first page
                var pageNumber = 1;
                pdf.getPage(pageNumber).then(function (page) {
                    console.log('Page loaded');

                    var scale = 1;
                    var viewport = page.getViewport({ scale: scale });

                    // Prepare canvas using PDF page dimensions
                    const container = document.querySelector('.content');
                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    container.appendChild(canvas);

                    // Render PDF page into canvas context
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    var renderTask = page.render(renderContext);
                    renderTask.promise.then(function () {
                        console.log('Page rendered');
                    });
                });
            });
        } else {
            Tools.addLoading();
            const datas = await Tools.readDir();
            if (datas) {
                Tools.data.datas = datas.datas;
                // 判断是否全部是音频
                const isAllMusic = datas.datas.every(data => {
                    // console.log(data.ext,Tools.isMusicFile(data.ext));
                    return Tools.isMusicFile(data.ext);
                });
                if (isAllMusic) {
                    Tools.playMusic();
                } else if (Musice) {
                    Tools.playMusic();
                } else {
                    Tools.updataHtml();
                    // 是否存在音频
                    // const hasMusic = datas.datas.some(data => {
                    //     return Tools.isMusicFile(data.ext);
                    // });
                    // if (hasMusic) {
                    //     const url = new URL(window.location.href);
                    //     url.searchParams.set('musice', 1);
                    //     const qpbt = document.createElement('a');
                    //     qpbt.classList.add('bottom-right-button');
                    //     qpbt.style = 'bottom:5.3em;line-height:1em;';
                    //     qpbt.href = url.toString();
                    //     qpbt.innerHTML = `<span style="font-size:1em;">全屏播放</span>`;
                    //     document.querySelector('.content').appendChild(qpbt);
                    // }
                }
            }
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
    }
}
Tools.initialization();