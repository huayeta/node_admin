const SqliteDB = require('./sqlite').SqliteDB;
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const base_path = path.resolve(__dirname, './beian-datas.db');

const sqliteDB = new SqliteDB(base_path);

// 备案结构
// {id:整数自增,qq:string,wx:string,phone:string,入职时间enter_date:timestamp,备注note:string[],搜索次数search_times:number,创建时间start_date:timestamp}[]
// 创建一个用户表
const createTableUsersSql = 'create table if not exists users(id INTEGER PRIMARY KEY AUTOINCREMENT, qq TEXT,wx TEXT,phone TEXT,enter_date TIMESTAMP,search_time INTEGER DEFAULT 0,create_date timestamp default current_timestamp)';
sqliteDB.createTable(createTableUsersSql);
// 创建notes表
// {id:int自增,user_id:int用户id,note:string,create_date:timestamp}
const createTableNotesSql = `create table if not exists notes(id integer primary key autoincrement, user_id integer, note text, create_date timestamp default current_timestamp,foreign key (user_id) REFERENCES users(id))`;
sqliteDB.createTable(createTableNotesSql);

// 插入数据
// const insertUserSql = 'insert into users(qq,wx,phone,enter_date) values(?,?,?,?)';
// const userData = [['qq1', 'wx1','phone1',new Date().getTime()]];
// sqliteDB.insertData(insertUserSql,userData);

// // 查询数据
// const search_text ='qq2';
// const querySql = `select * from users where qq LIKE '%${search_text}%' or wx LIKE '%${search_text}%' or phone LIKE '%${search_text}%' or note LIKE '%${search_text}%'`;
// sqliteDB.queryData(querySql,function(rows){
//     console.log(rows);
// });

// // 更新数据
// const updataSql = 'update users set qq="qq2" where id =1';
// sqliteDB.executeSql(updataSql);
// // 更新后查询数据
// sqliteDB.queryData('select * from users where id =1',function(rows){
//     console.log(rows);
// });
// sqliteDB.close();

const app = express();
const port = 3000;

// 在处理程序之前使用中间件解析传入请求主体，可在req.body属性下访问
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 判断参数是否存在
const Tools={
    sendMessage:(code=0,message='',datas)=>{
        const result ={
            code:code,
            message:message,
        }
        if(datas)result['datas']=datas;
        return result;
    },
    // 判断参数是否存在
    pamExit:(obj)=>{
        const results = [];
        Object.keys(obj).forEach(key=>{
            const value = obj[key];
            if(!value)results.push(`${key}不存在`);
        })
        return results;
    }
}

app.use(function(req,res,next){
    res.sendMessage=function(code,message,datas){
        res.send(Tools.sendMessage(code,message,datas))
    }
    res.successMessage = function(message,datas){
        res.sendMessage('0',message,datas);
    }
    res.failMessage = function(message,datas){
        res.sendMessage('-1',message,datas);
    }
    next();
})

// 查询qq|wx|phone|note
app.get('/search', (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
        // res.send(Tools.sendMessage('-1','没有keyword'))
        res.failMessage('没有keyword');
        return;
    }
    if (keyword.length < 4) {
        // res.send(Tools.sendMessage('-1','keyword最少4位'))
        res.failMessage('keyword最少4位');
        return;
    }
    // 组合搜索sql语句
    const searchSql = (arr) => {
        let sql = 'select users.id,users.qq,users.wx,users.phone from users left JOIN notes ON notes.user_id = users.id where';
        for (let i = 0; i < arr.length; i++) {
            const keyword = arr[i];
            sql += ` users.qq LIKE '%${keyword}%' or users.wx LIKE '%${keyword}%' or users.phone LIKE '%${keyword}%' or notes.note LIKE '%${keyword}%'${i !== arr.length - 1 ? ' or' : ''}`;
        }
        return sql;
    }
    const querySql = searchSql([keyword]);
    sqliteDB.queryData(querySql, (err,datas) => {
        if(err!=null){
            return res.failMessage(err.message);
            // return res.send('-1',err.message);
        }
        if (datas.length > 0) {
            // 得到所有的keyword
            let keywords = [];
            for (let i = 0; i < datas.length; i++) {
                const data = datas[i];
                if (data.qq) keywords.push(data.qq);
                if (data.wx) keywords.push(data.wx);
                if (data.phone) keywords.push(data.phone);
            }
            // 去重
            keywords = [...new Set(keywords)];
            const querySql_tmp = searchSql(keywords);
            sqliteDB.queryData(querySql_tmp, (err,rows) => {
                if(err!=null){
                    return res.failMessage(err.message);
                }
                // return res.successMessage('',rows);
                // console.log(rows);
                let ids = [];
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    ids.push(row.id);
                }
                // 去充
                ids = [...new Set(ids)];
                let idsSql = 'select * form users where';
                ids.forEach((id,index)=>{
                    idsSql+=` id = ${id} ${}`
                })
                sqliteDB.queryData()
                // 搜索次数+1
                let updateSearchTimeSql = [];
                Object.keys(results).forEach(id => {
                    updateSearchTimeSql.push(`update users set search_time=search_time+1 where id =${id}`);
                })
                Promise.all(updateSearchTimeSql.map(sql => {
                    return new Promise((resolve, reject) => {
                        sqliteDB.executeSql(sql, resolve)
                    })
                })).then(() => {

                })
                res.send(Tools.sendMessage('0',null,Object.values(results)))
            })
        } else {
            res.send(Tools.sendMessage('0','没有查询到数据',[]))
        }
    })
})
// note的添加
app.post('/user/note', (req, res) => {
    const { note, user_id } = req.body;
    const bodyExit = Tools.pamExit({note,user_id});
    if(bodyExit.length>0)return res.send(Tools.sendMessage('-1',bodyExit));

})

app.listen(port, () => {
    console.log(`Server runing at http://127.0.0.1:${port}/`)
})


