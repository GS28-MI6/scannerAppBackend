const config = require("./config");
const express = require("express");
const server = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
var cors = require("cors");

server.listen(config.port, function() {
  console.log("%s listening at %s", config.port);
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
require("./routes/customers.js")(server);
require("./routes/users.js")(server);
