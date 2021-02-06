const config = require("./config");
let cors = require("cors");
let express = require("express"),
  path = require("path"),
  nodeMailer = require("nodemailer"),
  bodyParser = require("body-parser");

const bcrypt = require("bcryptjs");

let server = express();
let serverMod = express();
let app = require("http").Server(server);
let appMod = require("http").Server(serverMod);


server.use(express.static("src"));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(cors());
serverMod.use(express.static("src"));
serverMod.use(bodyParser.urlencoded({ extended: true }));
serverMod.use(bodyParser.json());
serverMod.use(cors());

app.listen(config.port, function() {
  console.log("%s is listening", config.port);
});
appMod.listen(4100, function() {
  console.log("%s is listening", 4100);
});

/**
 * Initialize Server
 */

require("./routes/appData.js")(server);
require("./routes/appDataMod.js")(serverMod);
require("./routes/users.js")(server);
require("./routes/usersMod.js")(serverMod);