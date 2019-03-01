const mysql = require('../db/mysql');

function mysql_query(sql){
    return new Promise(async function(resolve, reject){
        try {
            let data = await mysql.async_query(sql);
            resolve(data);
        }catch(e){
            reject(e);
        }
    })
}

module.exports.mysql_query = mysql_query;