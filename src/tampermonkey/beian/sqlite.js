const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB = {};

DB.SqliteDB = function (file) {
    DB.db = new sqlite3.Database(file);

    DB.exist = fs.existsSync(file);
    if (!DB.exist) {
        console.log('createing db file!');
        fs.openSync(file, 'w');
    }
}

DB.prientErrorInfo = function (err) {
    console.log(`Error Message：${err.message}。ErrorNuber：${err.no}`);
}

DB.SqliteDB.prototype.createTable = function (sql) {
    DB.db.serialize(function () {
        DB.db.run(sql, function (err) {
            if (err != null) {
                DB.prientErrorInfo(err);
                return;
            }
        })
    })
}

/// tilesData format; [[level, column, row, content], [level, column, row, content]]
DB.SqliteDB.prototype.insertData = function (sql, datas = []) {
    DB.db.serialize(function () {
        const stmt = DB.db.prepare(sql);
        for (let i = 0; i < datas.length; i++) {
            stmt.run(datas[i]);
        }

        stmt.finalize();
    })
}

DB.SqliteDB.prototype.queryData = function (sql, callback) {
    DB.db.all(sql, function (err, rows) {
        if (err != null) {
            DB.prientErrorInfo(err);
            return;
        }

        // deal query data
        if (callback) {
            callback(rows);
        }
    })
}

DB.SqliteDB.prototype.executeSql = function (sql,callback=()=>{}) {
    DB.db.run(sql, function (err) {
        if (err != null) {
            DB.prientErrorInfo(err);
            return;
        }
        callback();
    })
}
DB.SqliteDB.prototype.close = function () {
    DB.db.close();
}

exports.SqliteDB = DB.SqliteDB;