const Sequelize = require('sequelize');
const mysql_conf = require("./mysql_config");

const mysql_sequelize = new Sequelize(mysql_conf.database, mysql_conf.user, mysql_conf.password, {
    host: mysql_conf.host,
    dialect: 'mysql',
    dialectOptions:{
        insecureAuth:mysql_conf.insecureAuth
    },
    timezone:'+08:00',
    pool: {
        max: 10,
        min: 0,
        idle: 10000
    }
});

module.exports = mysql_sequelize;
