// 格式化问大家
const fs = require('fs');
const fse = require('fs-extra');

const json = JSON.parse(fs.readFileSync('json1.json'));

const keys = Object.keys(json);
let Text = '';
keys.forEach((key,index)=>{
    Text+=`${index+1}:${json[key].title}`;
    Text+=`回答：${json[key].list.join('\n')}`;
})
fse.writeFile('json.text',Text);
console.log('写入成功 json.text')