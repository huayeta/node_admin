import request from 'request';
import fse from 'fs-extra';
import path from 'path';

const db = fse.readJSONSync(path.join(__dirname, './pdd-db.json'));
// console.log(db);

const getCatNames = (id: number) => {
    const catids = getCatIds(id);
    if (!catids) return '';
    return [db[catids[0]].name, db[catids[1]].cat_name, db[catids[2]].cat_name];
};
const getCatIds = (id: number) => {
    const cat3 = db[id];
    if (!cat3) return;
    return [cat3.cat_id_1, cat3.cat_id_2, cat3.cat_id_3];
};
// console.log(getCatNames([18637, 18711, 18720]));
export default getCatNames;
