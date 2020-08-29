import axios from 'axios';

const getData = async (val: number) => {
    const res = await axios.get('http://www.taoyanhao.com/zhishumap', {
        params: {
            num: val,
            type: '交易额'
        },
        headers: {
            Host: 'www.taoyanhao.com',
            cookie:'__cfduid=d3e1bc7e42d4c88de991ce456428b37651597552100; SessionId=jtcodi0xgnoqpopqeinlvzds; Hm_lvt_dab68e029c4a0d36d12a9daef17eef11=1597552117; Hm_lpvt_dab68e029c4a0d36d12a9daef17eef11=1598176239; user=_w=oZSvfjoONyex3rTDKdw-cgxplpSw&_t=20200823175205&_k=55160494A6043F0E23FB5C90D6F6D62C&_m=232535'
        }
    });
    return res.data;
};
export const getJye = async (arr: number[]) => {
    const pl = arr.map(num => getData(num));
    const results = await Promise.all(pl);
    return results.map(result =>
        result.success ? result.value : ''
    );
};
// getData(122222).then(res => {
//     console.log(res);
// });
