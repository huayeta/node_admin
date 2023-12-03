const SqliteDB = require('./sqlite').SqliteDB;
const path = require('path');
const express = require('express');

const app = express();
const port = 3000;

const base_path = path.resolve(__dirname, './beian-datas.db');

const sqliteDB = new SqliteDB(base_path);

// 备案结构
// {qq:string,wx:string,phone:string,入职时间enter_time:string,备注note:string[],搜索次数search_times:number}[]
// 创建一个表
const createTableSql = 'create table if not exists users(id INTEGER PRIMARY KEY AUTOINCREMENT, qq TEXT,wx TEXT,phone TEXT,enter_time TIMESTAMP,note TEXT,search_time INTEGER DEFAULT 0)';
sqliteDB.createTable(createTableSql);

// 插入数据
const insertUserSql = 'insert into users(qq,wx,phone,enter_time) values(?,?,?,?)';
const userData = [['qq1', 'wx1','phone1',new Date().getTime()]];
// sqliteDB.insertData(insertUserSql,userData);

// // 查询数据
const search_text ='wx2';
const querySql = `select * from users where qq LIKE '%${search_text}%' or wx LIKE '%${search_text}%' or phone LIKE '%${search_text}%' or note LIKE '%${search_text}%'`;
sqliteDB.queryData(querySql,function(rows){
    console.log(rows);
});

// // 更新数据
// const updataSql = 'update users set qq="qq2" where id =1';
// sqliteDB.executeSql(updataSql);
// // 更新后查询数据
// sqliteDB.queryData('select * from users where id =1',function(rows){
//     console.log(rows);
// });
// sqliteDB.close();


