const SqliteDB = require('./sqlite').SqliteDB;
const path = require('path');
const express = require('express');

const base_path = path.resolve(__dirname, './beian-datas.db');

const sqliteDB = new SqliteDB(base_path);

// 备案结构
// {qq:string,wx:string,phone:string,入职时间enter_time:string,备注note:string[],搜索次数search_times:number}[]
// 创建一个用户表
const createTableUsersSql = 'create table if not exists users(id INTEGER PRIMARY KEY AUTOINCREMENT, qq TEXT,wx TEXT,phone TEXT,enter_time TIMESTAMP,search_time INTEGER DEFAULT 0)';
sqliteDB.createTable(createTableUsersSql);
// 创建notes表
const createTableNotesSql = `create table if not exists notes(id integer primary key autoincrement, user_id integer, note text, foreign key (user_id) REFERENCES users(id))`;
sqliteDB.createTable(createTableNotesSql);

// 插入数据
// const insertUserSql = 'insert into users(qq,wx,phone,enter_time) values(?,?,?,?)';
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

// 组合搜索sql语句
const searchSql = (arr)=>{
    let sql = 'select * from users LEFT JOIN notes ON notes.user_id = users.id where';
    for(let i =0;i<arr.length;i++){
        const keyword = arr[i];
        sql+=` users.qq LIKE '%${keyword}%' or users.wx LIKE '%${keyword}%' or users.phone LIKE '%${keyword}%' or notes.note LIKE '%${keyword}%'${i!==arr.length-1?' or':''}`;
    }
    return sql;
}

// 查询qq|wx|phone|note
app.get('/search',(req,res)=>{
    const {keyword} = req.query;
    if(!keyword){
        res.send({
            code:0,
            message:'没有keyword',
            datas:[]
        })
        return;
    }
    if(keyword.length <=2){
        res.send({
            code:0,
            message:'keyword最少3位',
            datas:[]
        })
        return;
    }
    const querySql = searchSql([keyword]);
    sqliteDB.queryData(querySql,(datas)=>{
        if(datas.length>0){
            // 得到所有的keyword
            let keywords = [];
            for(let i = 0;i<datas.length;i++){
                const data = datas[i];
                if(data.qq)keywords.push(data.qq);
                if(data.wx)keywords.push(data.wx);
                if(data.phone)keywords.push(data.phone);
            }
            // 去重
            keywords = [...new Set(keywords)];
            const querySql_tmp = searchSql(keywords);
            sqliteDB.queryData(querySql_tmp,rows=>{
                const results = {};
                for(let i =0;i<rows.length;i++){
                    const row =rows[i];
                    const {note,user_id,id,...data}= row;
                    if(!results[user_id]){
                        results[user_id]={...data,id:user_id,notes:[{id,note,user_id}]};
                    }else{
                        results[user_id].notes.push({id,note,user_id});
                    }
                }
                // 搜索次数+1
                let updateSearchTimeSql = [];
                Object.keys(results).forEach(id=>{
                    updateSearchTimeSql.push(`update users set search_time=search_time+1 where id =${id}`);
                })
                Promise.all(updateSearchTimeSql.map(sql=>{
                    return new Promise((resolve,reject)=>{
                        sqliteDB.executeSql(sql,resolve)
                    })
                })).then(()=>{
                    
                })
                res.send({
                    code:0,
                    message:'',
                    datas:Object.values(results)
                })
            })
        }else{
            res.send({
                code:0,
                message:'没有查询到数据',
                datas:[]
            })
        }
    })
})

app.listen(port,()=>{
    console.log(`Server runing at http://127.0.0.1:${port}/`)
})


