var mysql = require("mysql");

module.exports = {
  name: "rest-api",
  hostname: "http://10.0.2.2",
  version: "0.0.1",
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 4000,
  db: {
    get: mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "passwordMuniSarmientoMySQL",
      database: "municipiocapitansarmiento"
    })
  }
};