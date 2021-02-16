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
    var { email, usuario, contraseña } = req.body;

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(contraseña, salt, async (err, hash) => {
        // Hash Password
        contraseña = hash;
        // Save User
        connection.query(
          "INSERT INTO clientes SET email=?, usuario=?, contraseña=?",
          [email, usuario, contraseña],
          function (error, results, fields) {
            if (error) {
              console.log(error);
              res.status(200).send({
                ErrorCode: 400,
                Errors: ["Fallo al agregar un usuario"],
                Response: error,
              });
            } else {
              let jsonResponse = JSON.stringify(results);
              res
                .status(200)
                .send({ ErrorCode: 0, Errors: [], Response: jsonResponse });
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
      const token = jwt.sign(JSON.parse(user), config.JWT_SECRET);

      const { iat, exp } = jwt.decode(token);
      // Respond with token
      //console.log(email);
      // let jsonResponse = JSON.stringify(results)
      res.status(200).send({ ErrorCode: 0, Errors: [], Response: {token: token} });
      next();
    } catch (err) {
      if (err === "Authentication Failed") {
        console.log(err);
        res.status(200).send({
          ErrorCode: 401,
          Errors: ["Fallo al autenticar al usuario"],
          Response: error,
        });
        // res.json({ message: err.name + ": " + err.message });
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
