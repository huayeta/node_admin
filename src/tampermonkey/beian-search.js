const fs = require('fs');

const PATH = './beian-datas.js';

// 备案结构
// {qq:string,wx:string,phone:string,入职时间enter_time:string,备注note:string[],搜索次数search_times:number}[]
const BEIAN = {
    datas:[],
    storageDatas:()=>{
        fs.writeFileSync(PATH,BEIAN.datas);
    },
    addData:(data={})=>{
        const {qq,wx,enter_time} = data;
        if(Tools.alertFuc({enter_time}))return false;
        if(!qq && !wx){
            alert(`qq|wx最少填写一个`)
            return false;
        }
        BEIAN.datas.push({id:BEIAN.datas.length,...data});
        BEIAN.storageDatas();
    },
    delData:(id)=>{
        BEIAN.datas = BEIAN.datas.filter(data=>data.id !== +id);
        BEIAN.storageDatas();
    }
};
const Tools = {
    alertFuc: obj => {
        const keys = Object.keys(obj);
        const values = Object.values(obj);
        let result = false;
        for (let i = 0; i < keys.length; i++) {
            if (!values[i]) {
                alert(`${keys[i]}不能为空`);
                result = true;
                break;
            }
        }
        // 判断是否有pig_phone数据是否存在
        const pig_phone = obj['pig_phone'];
        if (keys.includes('pig_phone')) {
            if (!DATA[pig_phone]) {
                alert('不存在做单数据');
                result = true;
            }
        }
        return result;
    },
    copyObj: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
}