const config = require("./config");
//const express = require("express");
//const server = express();
//const bodyParser = require("body-parser");
const mysql = require("mysql");
var cors = require("cors");

let express = require("express"),
  path = require("path"),
  nodeMailer = require("nodemailer"),
  bodyParser = require("body-parser");

const bcrypt = require("bcryptjs");

let server = express();
var app = require("http").Server(server);


server.use(express.static("src"));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());


app.listen(config.port, function() {
  console.log("%s is listening", config.port);
});

server.use(cors());
/**
 * Initialize Server
 */

server.use(bodyParser.json());
server.use(
  bodyParser.urlencoded({
    extended: true
  })
);

require("./routes/appData.js")(server);
require("./routes/esqueletos.js")(server);
require("./routes/users.js")(server);
require("./routes/jobs.js")(server);

var connection = config.db.get;