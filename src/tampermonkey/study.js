
// 获取网址上面的query参数
// const Url = new URL(window.location.href);
// const QUERY = Url.searchParams.get('query') ? Url.searchParams.get('query') : '';
const rawQuery = window.location.href.split('?')[1];
let QUERY = '';
if (rawQuery) {
    const paramPairs = rawQuery.split('&');
    const targetParam = paramPairs.find(pair => pair.startsWith('query='));
    if (targetParam) {
        const value = targetParam.split('=')[1];
        QUERY = decodeURIComponent(value);
    }
}
console.log(QUERY);

const Tools = {
    objectToQueryParams: (params) => {
        return Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    },
    fetch: async (query) => {
        // console.log(Tools.objectToQueryParams(params));
        const res = await fetch(`/api/dir?${query ? Tools.objectToQueryParams({ query }) : ''}`);
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
        const datas = await Tools.fetch(QUERY);
        if (datas && datas.code == 0) {
            return datas;
        }
    },
    updataHtml: (datas) => {
        const str = `
            <h1>${QUERY}</h1>
            <ul>
                ${datas.map((data) => {
            return `<li><a ${data.type == "file" ? `target="_black"` : ''} href="?query=${QUERY ? `${QUERY}\\` : ''}${data.file}">${data.file}</a></li>`;
        }).join('')}
            </ul>`
        document.querySelector('.content').innerHTML = str;
    },
    initialization: async () => {
        const datas = await Tools.readDir();
        if (datas) Tools.updataHtml(datas.datas);
        document.title = QUERY;
    }
}
Tools.initialization();