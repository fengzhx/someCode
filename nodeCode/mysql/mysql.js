const sequelize = require('./mysql_sequelize');

function mysql() {
    this.query = function (sql,callback) {
        sequelize.query(sql).spread(function(result,metadata){
            callback(null,result);
        }).catch(function (e) {
            callback(e,"error");
        })
    };

    this.async_query = function(sql){
        return new Promise(function(resolve,reject){
            sequelize.query(sql).spread(function(result,metedata){
                resolve(result);
            }).catch(function(e){
                console.log("database error"+e);
                reject(e);
            })
        })
    }
}

module.exports = new mysql();