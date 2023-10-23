const fs = require('fs');
const path = require('path');

const DATA = [];
const SUM = 2;//每天看几本

let LISTS = [];//需要记忆的书

// 模拟list 0-100
// for (let i = 1; i <= 100; i++) {
//     LISTS.push(`list ${i}`);
// }

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

// 文件目录路径
const directoryPath = 'E:\\绘本\\其他资源绘本\\RAZ\\C级别PDF';

// 塞入每天的艾宾浩斯法的路线
const AddPlan = (content, order) => {
    // 0包括了初次记忆，7天一循环，去除15天
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

// 调用函数读取目录
readDirectoryAsync(directoryPath)
    .then(files => {
        // 输出结果
        LISTS = files.map(file => removeFileExtension(file));

        // 进行分组后添加到计划里面
        groupByLists(LISTS, SUM).forEach((list, index) => {
            AddPlan(list, index);
        })
        // 输出函数
        const printLists = () => {
            DATA.forEach((data, index) => {
                console.log(`第${index + 1}天：${data}`);
            })
        }
        printLists();
    })
    .catch(error => {
        console.error('Error reading directory:', error);
    });