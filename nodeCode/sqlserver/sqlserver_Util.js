const sqlserver = require('./sqlserver');

function sqlserver_query(sql){
    return new Promise(async function(resolve, reject){
        try {
            let data = await sqlserver.async_query(sql);
            resolve(data);
        }catch(e){
            reject(e);
        }
    })
}

module.exports.sqlserver_query = sqlserver_query;