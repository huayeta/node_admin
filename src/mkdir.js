const fs = require('fs-extra');

for (let i=1;i<=50;i++){
    fs.ensureDirSync(`./${i}`)
}