class Uploader {
    constructor({
        url,
        merge_url,
        file_dom,
        onProgressItem = (index, percentage) => index,
        onProgress = percentage => percentage,
        max_chunk_size = 2 //单位M
    }) {
        this.url = url;
        this.merge_url = merge_url;
        this.file_dom = file_dom;
        this.onProgressItem = onProgressItem;
        this.onProgress = onProgress;
        this.max_chunk_size = max_chunk_size;
        this._total = 0;
        this._requestList = [];
    }
    // 上传
    request({
        url,
        method = 'post',
        data,
        headers = {},
        requestList,
        onProgress = e => e
    }) {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = onProgress;
            xhr.open(method, url);
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });
            xhr.send(data);
            xhr.onload = e => {
                // 将请求成功的xhr从列表删除
                if (requestList) {
                    const xhrIndex = requestList.findIndex(
                        item => item === xhr
                    );
                    requestList.splice(xhrIndex, 1);
                }
                resolve({ data: e.target.response });
            };
            // 暴漏当前xhr给外部
            if (requestList) requestList.push(xhr);
        });
    }
    getFile() {
        const [file] = this.file_dom.files;
        if (!file) return;
        this._file = file;
        this._total = file.size;
        return file;
    }
    // 生成文件hash(web-worker)
    calculateHash(fileChunkList) {
        return new Promise(resolve => {
            // 添加worker属性
            this._worker = new Worker('/static/hash.js');
            this._worker.postMessage({ fileChunkList });
            this._worker.onmessage = e => {
                const { percentage, hash } = e.data;
                // this.hashPercentage = percentage;
                if (hash) {
                    resolve(hash);
                }
            };
        });
    }
    // 生成切片;
    createFileChunk(file) {
        const fileChunkList = [];
        let length = 1;
        const chunkSize = this.max_chunk_size * 1024 * 1024;
        if (file.size > chunkSize) {
            length = Math.ceil(file.size / chunkSize);
        }
        let count = 0;
        let cur = 0;
        while (cur < file.size) {
            fileChunkList.push({
                index: count,
                chunk: file.slice(cur, cur + chunkSize)
            });
            cur += chunkSize;
            count++;
        }
        return fileChunkList;
    }
    // 得到总进度
    getPercentage() {
        const _loaded = this._fileChunkList.reduce((acc, chunk) => {
            return acc + chunk.loaded;
        }, 0);
        return parseInt(String((_loaded / this._total) * 100));
    }
    //创建进度函数
    createProgressHandler(index) {
        return e => {
            const percentage = parseInt(String((e.loaded / e.total) * 100));
            this.onProgressItem(index, percentage);
            this._fileChunkList[index].loaded = e.loaded;
            const percentage_total = this.getPercentage();
            this.onProgress(percentage_total);
        };
    }
    // 创建一个请求
    createRequest({ chunk, hash, index }, cb) {
        const fileHash = this._fileHash;
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('hash', hash);
        // formData.append('fileName', fileName);
        formData.append('fileHash', fileHash);
        return {
            index,
            hash,
            xhr: this.request({
                url: this.url,
                data: formData,
                onProgress: this.createProgressHandler(index),
                requestList: this._requestList
            }).then(res => {
                const index = this._stacks.findIndex(
                    stack => stack.hash === hash
                );
                this._stacks.splice(index, 1);
                this.pushStack(cb);
            })
        };
    }
    pushStack(cb) {
        if (this._chunks.length > 0) {
            const chunk = this._chunks.shift();
            this._stacks.push(this.createRequest(chunk, cb));
        }
        if (this._stacks.length === 0) cb();
    }
    // 发送请求连接堆栈
    createStacks(fileChunkList) {
        this._chunks = [...fileChunkList];
        this._stacks = [];
        return new Promise(resolve => {
            for (let i = 0; i < 6; i++) {
                this.pushStack(resolve);
            }
        });
    }
    // 上传切片
    async uploadChunks(fileChunkList) {
        const fileName = this._file.name;
        const fileHash = this._fileHash;
        const exit = fileName.slice(
            fileName.lastIndexOf('.') + 1,
            fileName.length
        );
        const requestList = fileChunkList.filter(
            ({ percentage, index, chunk }) => {
                const is_exit = percentage === 100;
                if (is_exit)
                    this.createProgressHandler(index)({
                        loaded: chunk.size,
                        total: chunk.size
                    });
                return !is_exit;
            }
        );
        await this.createStacks(requestList);
        // 并发切片
        await this.mergeRequest({ fileHash, exit });
    }
    // 合并请求
    async mergeRequest({ fileHash, exit }) {
        const formData = new FormData();
        formData.append('fileHash', fileHash);
        formData.append('exit', exit);
        await this.request({
            url: this.merge_url,
            data: formData
        });
    }
    // 判断文件是否已经上传-秒传
    async verifyUpload(fileName, fileHash) {
        const formData = new FormData();
        formData.append('fileName', fileName);
        formData.append('fileHash', fileHash);
        const { data } = await this.request({
            url: '/upload/verify',
            data: formData
        });
        return JSON.parse(data);
    }
    // 上传
    async loader() {
        const file = this.getFile();
        if (!file) return;
        const fileChunkList = this.createFileChunk(file);
        const fileHash = await this.calculateHash(fileChunkList);
        this._fileHash = fileHash;
        this._fileChunkList = fileChunkList.map(chunk => {
            const { index } = chunk;
            chunk.hash = `${this._fileHash}-${index}`;
            chunk.fileHash = this._fileHash;
            chunk.percentage = 0;
            chunk.loaded = 0;
            return chunk;
        });
        const fileName = file.name;
        const { code, message, data } = await this.verifyUpload(
            fileName,
            fileHash
        );
        if (code === 0) return console.log('秒传成功', data);
        if (code === 1) {
            this._fileChunkList.map(chunk => {
                const { hash } = chunk;
                const exit_chunk = data.includes(hash);
                if (exit_chunk) chunk.percentage = 100;
                return chunk;
            });
        }
        await this.uploadChunks(this._fileChunkList);
    }
    //暂停
    async pause() {
        this._requestList.forEach(xhr => xhr.abort());
        this._requestList = [];
        this._stacks = [];
    }
}
function getDom(id) {
    return document.getElementById(id);
}
const $uploadBtn = getDom('uploadBtn');
const $uploadPause = getDom('uploadPause');
const $uploadResume = getDom('uploadResume');
const $file = getDom('file');
const uploader = new Uploader({
    url: '/upload/file',
    merge_url: '/upload/merge',
    file_dom: $file,
    onProgressItem: (index, percentage) => console.log(index, percentage),
    onProgress: percentage => console.log(percentage)
});
$uploadBtn.addEventListener(
    'click',
    async function() {
        await uploader.loader();
    },
    false
);
$uploadPause.addEventListener(
    'click',
    async function() {
        await uploader.pause();
    },
    false
);
$uploadResume.addEventListener(
    'click',
    async function() {
        await uploader.loader();
    },
    false
);
