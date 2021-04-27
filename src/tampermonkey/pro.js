const fs = require('fs');

const json = JSON.parse(fs.readFileSync('json1.json'));

const keys = Object.keys(json);

keys.forEach((key,index)=>{
    console.log(`${index+1}:${json[key].title}`);
    console.log(`回答：${json[key].list.join('\n')}`);
})