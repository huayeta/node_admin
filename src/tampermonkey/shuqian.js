const DATA = [
    { url: 'https://sap-doc.nasdaddy.com/', title: '社交媒体自动化上传工具', desc: '一站式解决方案，支持抖音、小红书、视频号、TikTok、YouTube、Bilibili等平台的视频自动上传与发布' },
    { url: 'https://github.com/AIDC-AI/Pixelle-Video', title: 'AI 全自动短视频生成引擎', desc: '从文案、素材、剪辑到配音全自动生成短视频，支持批量生产，适合内容创作者、MCN 机构做自动化内容运营。' },
    { url: 'https://github.com/OpenBMB/VoxCPM', title: 'VoxCPM语音生成克隆', desc: '面向多语言语音生成、创意语音设计与高保真语音克隆的无分词器文本转语音模型' },
    { url: 'https://github.com/YILING0013/AI_NovelGenerator', title: 'AI 小说生成器', desc: '用大模型自动生成多章节小说，支持上下文衔接、伏笔设计，适合网文作者、内容创作者快速产出故事内容。' },
    { url: 'https://github.com/forrestchang/andrej-karpathy-skills', title: 'Claude Code 的执行规范', desc: '给 Claude Code 提供一套规范的 "技能集"，让 AI 理解你的项目结构、代码风格，大幅提升代码质量和协作效率。' },
];

class BookmarkTable {
    constructor(container, data) {
        this.container = container;
        this.data = data;
    }

    render() {
        this.container.innerHTML = this._tableHTML();
    }

    _tableHTML() {
        return `
            <table class="el-table" style="table-layout: auto; max-width: 100%; width: 100%;">
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>名称</th>
                        <th>网址</th>
                        <th style="width:100%">描述</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.data.map((item, index) => `
                        <tr>
                            <td class="f-tac">${index + 1}</td>
                            <td>${item.title}</td>
                            <td><a href="${item.url}" target="_blank">${item.url}</a></td>
                            <td>${item.desc}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

const $content = document.querySelector('.content');
new BookmarkTable($content, DATA).render();