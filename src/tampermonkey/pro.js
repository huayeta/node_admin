// 格式化问大家
const fs = require('fs');
const fse = require('fs-extra');

const json = JSON.parse(fs.readFileSync('json1.json'));

const keys = Object.keys(json);
let Text = '';
keys.forEach((key,index)=>{
    if(index!==0)Text+='\n';
    Text+=`${index+1}:${json[key].title}\n`;
    Text+=`${json[key].list.map(text=>`    回答：${text}`).join('\n')}`;
})
fse.writeFile('json.text',Text);
console.log('写入成功 json.text')