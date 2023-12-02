const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const base_path = path.resolve(__dirname, './beian-datas.db');

// 打开一个 SQLite 数据库连接
let db = new sqlite3.Database(base_path, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQLite database.');

    // // 创建一个表
    db.run('CREATE TABLE users(id INT, name TEXT)');

    // // 插入数据
    db.run('INSERT INTO users(id, name) VALUES(1, "Alice")');

    // 查询数据
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row.id, row.name);
        });
    });

    // 关闭数据库连接
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
});
