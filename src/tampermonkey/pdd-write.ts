import request from 'request';
import fse from 'fs-extra';
import path from 'path';

const db_path = path.join(__dirname, './pdd-db.json');

const db = fse.readJSONSync(db_path);

const getData = (url: string) => {
    return new Promise<IRes>(resolve => {
        request.get(
            {
                url,
                headers: {
                    cookie:
                        'api_uid=rBQhLl5AqmOsLXz3TgUXAg==; _nano_fp=XpdJXpPbn5PqXqXono_4xg45y09c7_SCyIzSDOCJ; mms_b84d1837=120; PASS_ID=1-T9M49Xx7w88X9KWQJ6yFWDs4dRoB/grh4JNSTXGIPnOGoQbyKcPCSUVtUFCcFVf9zxV/v8tIw1M49Bf79ThT6g_443173783_27879058; JSESSIONID=83AA0A66C440498E68ADE88CC0BF8382'
                }
            },
            (err, response, body) => {
                resolve(JSON.parse(body));
            }
        );
    });
};
interface Icat1 {
    id: number;
    name: string;
}
interface Icat {
    id: number;
    cat_name: string;
    cat_id_1: number;
    cat_id_2: number;
    cat_id_3: number;
    parent_id: number;
}
interface IIdCat {
    [propName: number]: Icat;
}
interface IRes {
    result: Icat[];
}
let catId: any = db;
let max_length = 0;
const getCat = async (cat1: Icat1) => {
    catId[cat1.id] = cat1;
    const cat2s = (
        await getData(
            'https://mms.pinduoduo.com/vodka/v2/mms/categories?parentId=' +
                cat1.id
        )
    ).result;
    for (let key in cat2s) {
        const cat2 = cat2s[key];
        catId[cat2.id] = cat2;
        const cat3s = (
            await getData(
                'https://mms.pinduoduo.com/vodka/v2/mms/categories?parentId=' +
                    cat2.id
            )
        ).result;
        cat3s.forEach((cat3: Icat) => {
            catId[cat3.id] = cat3;
        });
    }
    max_length--;
    fse.writeJSONSync(db_path, catId);
    console.log(`"${cat1.name}"读完 还剩${max_length}个`);
};

const write = async () => {
    const cats = (
        await getData('https://mms.pinduoduo.com/vodka/v2/mms/cat1List')
    ).result;
    max_length = cats.length;
    console.log(`一共${max_length}个`);
    for (let key in cats) {
        const cat1: any = cats[key];
        if (!catId[cat1.id]) {
            await getCat(cat1);
        } else {
            max_length--;
            console.log(`"${cat1.name}"读完 还剩${max_length}个`);
        }
    }
};
write();
