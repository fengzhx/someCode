const Sequelize = require('sequelize');
const sqlserver_conf = require("./sqlserver_config");

const sqlserver_sequelize = new Sequelize(sqlserver_conf.database, sqlserver_conf.user, sqlserver_conf.password, {
    host: sqlserver_conf.host,
    dialect: 'mssql',
    dialectOptions:{
        insecureAuth:sqlserver_conf.insecureAuth
    },
    timezone:'+08:00',
    pool: {
        max: 10,
        min: 0,
        idle: 10000
    }
});

module.exports = sqlserver_sequelize;
