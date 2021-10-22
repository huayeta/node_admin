// 循环建立50个文件夹

const fs = require('fs-extra');

for (let i=1;i<=50;i++){
    fs.ensureDirSync(`./${i}`)
}