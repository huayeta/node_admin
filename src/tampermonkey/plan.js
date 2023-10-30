const fs = require('fs');
const path = require('path');
const officegen = require('officegen');

const DATA = [];
let LISTS = [];//需要记忆的书

// 展开数组用指定分隔符
function flatten(arr, delimiter) {
    return arr.reduce((acc, val) => {
        if (Array.isArray(val)) {
            // 递归处理嵌套数组
            const nested = flatten(val, delimiter);
            return acc.concat(nested);
        } else {
            acc.push(val);
            return acc;
        }
    }, []).join(delimiter);
}

// 塞入每天的艾宾浩斯法的路线
const AddPlan = (content, order) => {
    // 0包括了初次记忆，7天一循环
    const cycle_time = [0, 1, 2, 4, 7, 15];
    cycle_time.forEach(time => {
        if (!DATA[order + time]) DATA[order + time] = [];
        DATA[order + time].unshift(content);
    })
}

// 一次看几个list
function groupByLists(arr, sum = 1) {
    let result = [];
    for (let i = 0; i < arr.length; i += sum) {
        let group = arr.slice(i, i + sum);
        result.push(group);
    }
    return result;
}

// 保存文档
// type 1:需要添加天数 2:直接输出内容
// data {}:可以大数据传入进去
const downloadDocx = (TITLE, type = 1, Data = { day: 30 }) => {

    // 创建 Word 文档对象
    const docx = officegen('docx');
    // 添加标题
    docx.createP().addText(TITLE, {
        bold: true,
        font_size: 18,
        align: 'center'
    })
    // docx.getFooter().createP(TITLE);

    DATA.forEach((data, index) => {
        switch (type) {
            case 1:
                // 添加每天标题
                docx.createP().addText(`第${index + 1}天`, {
                    font_face: 'Arial',
                    bold: true,
                    font_size: 16
                });
                // 添加正文内容
                if (!(Data.day && Data.day < index + 1)) {
                    docx.createP().addText(`学习内容：${data[0]}`);
                    if (data.length > 1) docx.createP().addText(`复习计划：${flatten(data.slice(1).reverse(), '，')}`)
                } else {
                    docx.createP().addText(`复习内容：${flatten(data.reverse(), '，')}`)
                }
                break;
            case 2:
                // 添加正文内容
                if (!(Data.day && Data.day < index + 1)) {
                    const docp2 = docx.createP();
                    docp2.addText(`第${index + 1}天：`, {
                        font_size: 14,
                    });
                    docp2.addText(`学习内容：____________________________________________；`, {
                        font_size: 14
                    });
                    docx.createP().addText(`${index + 1 >= 10 ? ' ' : ''}               复习计划：${flatten(data.reverse(), '，')}；`, {
                        font_size: 14
                    });
                } else {
                    docx.createP().addText(`第${index + 1}天：复习内容：${flatten(data.reverse(), '，')}；`, {
                        font_size: 14
                    })
                }
                break;
            default:
                // 添加正文内容
                docx.createP().addText(`${flatten(data.reverse(), '，')}`)
                break;
        }
    })

    // 保存文档为文件
    const filePath = `\planflod\\${TITLE}.docx`;
    const outputStream = fs.createWriteStream(filePath);
    docx.generate(outputStream);

    outputStream.on('close', () => {
        console.log(`${TITLE} 文档已生成`);
    });

    outputStream.on('error', err => {
        console.error(err);
    });

}

// 目录读取学习计划打印
const printDirLists = () => {
    // 学习计划名称
    const TITLE = 'RAZ C 学习计划';
    // 学习进度
    const SUM = 3;
    // 文件目录路径
    const directoryPath = 'E:\\绘本\\其他资源绘本\\RAZ\\C级别PDF';
    // 读取目录函数
    function readDirectoryAsync(path) {
        return new Promise((resolve, reject) => {
            fs.readdir(path, (error, files) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(files);
                }
            });
        });
    }
    // 去掉文件名的扩展
    function removeFileExtension(filename) {
        return path.parse(filename).name;
    }
    // 去除后缀 C007_Going Away_Password_Removed
    function removeOtherStr(str) {
        return str.replace(/_Password_Removed$/, "").replace(/^C\d+?_/,'');
    }
    // 调用函数读取目录
    readDirectoryAsync(directoryPath)
        .then(files => {
            // 输出结果 
            const lists = files.map(file => removeOtherStr(removeFileExtension(file)));

            // 进行分组后添加到计划里面
            LISTS = groupByLists(lists, SUM);
            LISTS.forEach((list, index) => {
                AddPlan(list, index);
            })
            console.log(DATA);
            // 保存计划
            downloadDocx(TITLE, 1, { day: LISTS.length });
        })
        .catch(error => {
            console.error('Error reading directory:', error);
        });
}
// printDirLists()
// 模拟学习课本学习计划打印1 -- 学习数据格式 第一本（16页）。。。
// 打开之后 添加页码1/2居中 添加页眉居中标题颜色灰色
const printLists1 = () => {
    // 学习计划名称
    const TITLE = '直映识字-学习计划';
    // 学习进度
    const SUM = 3;
    const lists = [];
    // 学习数据格式 第一本（16页）。。。
    // const sum = 16 + 20 + 32 + 34 + 30 + 34;
    [16, 20, 32, 34, 30, 34].forEach((page, index) => {
        // 第几本书
        const order = index + 1;
        for (let i = 1; i <= page; i++) {
            lists.push(`第${order}本（${i}）`)
        }
    })
    // 模拟list 0-100
    // for (let i = 1; i <= sum; i++) {
    //     LISTS.push(`list ${i}`);
    // }
    // 进行分组后添加到计划里面
    LISTS = groupByLists(lists, SUM);
    LISTS.forEach((list, index) => {
        AddPlan(list, index);
    })
    console.log(DATA);
    // 保存计划
    downloadDocx(TITLE, 1, { day: LISTS.length });
}
printLists1();
// 模拟天数学习计划打印2 -- 第一天学习序号1
// 打开之后调整页面间距适中 添加页码1/2居中 添加页眉居中标题颜色灰色 段落1.05
const printLists2 = () => {
    // 模拟天数
    const DAY = 60;
    // 学习计划名称
    const TITLE = `${DAY}天-学习计划`;
    // 学习进度
    const SUM = 1;
    // 构造课程
    for (let i = 1; i <= DAY; i++) {
        LISTS.push(`${i}`);
    }
    // 首先分组然后塞入计划
    groupByLists(LISTS, SUM).forEach((list, index) => {
        AddPlan(list, index);
    })
    // 打印计划
    DATA.forEach((data, index) => {
        console.log(`第${index + 1}天：${data}`);
    })
    // 保存计划
    downloadDocx(TITLE, 2, { day: DAY });
}
// printLists2();