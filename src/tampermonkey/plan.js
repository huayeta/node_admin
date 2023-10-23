const DATA = [];

// 塞入每天的艾宾浩斯法的路线
const AddPlan = (content, order) => {
    // 0包括了初次记忆，7天一循环，去除15天
    const cycle_time = [0, 1, 2, 4, 7,15];
    cycle_time.forEach(time => {
        if (!DATA[order + time]) DATA[order + time] = [];
        DATA[order + time].unshift(content);
    })
}

// 一次看几个list
function groupByLists(arr,sum=1) {
    let result = [];
    for (let i = 0; i < arr.length; i += sum) {
        let group = arr.slice(i, i + sum);
        result.push(group);
    }
    return result;
}

// 模拟list 0-100
const lists = [];
for (let i = 1; i <= 100; i++) {
    lists.push(`list ${i}`);
}
groupByLists(lists,2).forEach((list, index) => {
    AddPlan(list, index);
})
// 输出函数
const printLists = ()=>{
    DATA.forEach((data,index)=>{
        console.log(`第${index+1}天：${data}`);
    })
}
printLists();