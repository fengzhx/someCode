const file = "./../../sqlite/catsit.db";
let path = require('path');
let file2= path.join(__dirname,file);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(file2);

// console.log(file2);

function sqlLite_query(sql){
    return new Promise(async function(resolve, reject){
        try {
            db.all(sql,function(err,data){
                resolve(data);
            })
        }catch(e){
            reject(e);
        }
    })
}

function sqlLite_run(sql){
    return new Promise(async function(resolve, reject){
        try {
            let execSql = db.prepare(sql);
            execSql.run(function(err,data){
                resolve();
            })
        }catch(e){
            reject(e);
        }
    })
}

module.exports.sqlLite_run = sqlLite_run;
module.exports.sqlLite_query = sqlLite_query;