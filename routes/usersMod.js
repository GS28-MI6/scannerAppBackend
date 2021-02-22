const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../auth");
const config = require("../config");
const nodeMailer = require("nodemailer");
const { uuid } = require("uuidv4");

module.exports = (server) => {
  var connection = config.db.get;

  server.post("/client_register", (req, res, next) => {
    const { email, usuario, contraseña } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(contraseña, salt, async (err, hash) => {
        // Hash Password
        const password = hash;
        // Save User
        connection.query(
          "INSERT INTO clientes SET email=?, usuario=?, contraseña=?",
          [email, usuario, password],
          function (error, results, fields) {
            if (error) {
              console.log(error);
              res.status(200).send({
                ErrorCode: 400,
                Errors: ["Fallo al agregar el usuario."],
                Response: error,
              });
            } else {
              const Response = JSON.stringify(results);
              res.status(200).send({ ErrorCode: 0, Errors: [], Response });
            }
          }
        );
      });
    });
  });

  // Auth User
  server.post("/client_auth", async (req, res, next) => {
    console.log(req.body);
    var { usuario, contraseña } = req.body;
    console.log(req.body);
    try {
      // Authenticate User
      const user = await auth.authenticate(usuario, contraseña);
      // Create JWT
      const Token = jwt.sign(JSON.parse(user), config.JWT_SECRET);
      //Send response
      res.status(200).send({ ErrorCode: 0, Errors: [], Token });
      next();
    } catch (err) {
      if (err === "Authentication Failed") {
        console.log(err);
        res.status(200).send({
          ErrorCode: 401,
          Errors: ["Usuario y/o contraseña incorrecto/s."],
          Token: "",
        });
      } else {
        next(err);
      }
    }
  });

  server.post("/tokenAuth", function (req, res) {
    const token = req.body.token;
    console.log(token);
    if (token) {
      jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (error) {
          return res.status(200).send({
            ErrorCode: 401,
            Errors: ["Token invalida"],
            Response: error,
          });
        } else {
          req.decoded = decoded;
          res.status(200).send({ ErrorCode: 0, Errors: [], Response: decoded });
        }
      });
    } else {
      res
        .status(200)
        .send({ ErrorCode: 401, Errors: ["Token no proveida"], Response: {} });
    }
  });
};
