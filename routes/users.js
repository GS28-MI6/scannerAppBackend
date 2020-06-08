const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../auth");
const authMonitoreo = require("../authMonitoreo");
const config = require("../config");
const configCiudadanos = require("../configCiudadanos");
const nodeMailer = require("nodemailer");
const { uuid } = require("uuidv4");

module.exports = server => {
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
            function(error, results, fields) {
              if (error) {
                console.log(error);
                res.send(400, 400);
              } else {
                res.send(201, 201);
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
      res.send(token); //LA IDEA ES MANTENER LA SESION INICIADA

      next();
    } catch (err) {
      if (err === "Authentication Failed") {
        console.log(err);
        res.send(401, 401);
        // res.json({ message: err.name + ": " + err.message });
      } else {
        next(err);
      }
    }
  });

  server.post("/tokenAuth", function(req, res) {
    const token = req.body.token;
    console.log(token);
    if (token) {
      jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.json(400, { mensaje: "Token inválida" });
        } else {
          req.decoded = decoded;
          res.sendStatus(200, decoded);
        }
      });
    } else {
      res.send(400, {
        mensaje: "Token no proveída."
      });
    }
  });
}