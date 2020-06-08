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

  // Auth User
  server.post("/client_auth", async (req, res, next) => {
    console.log(req.body);
    var { email, password } = req.body;
    console.log(req.body);
    try {
      // Authenticate User
      const user = await auth.authenticate(email, password);

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

  server.post("/monitoreo_auth", async (req, res, next) => {
    console.log(req.body);
    var { email, password } = req.body;
    console.log(req.body);
    try {
      // Authenticate User
      const user = await authMonitoreo.authenticate(email, password);

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

  //Actualizar datos de usuario
  server.post("/client_update", (req, res, next) => {
    var { email, password, telefono } = req.body;

    var id_usuario = [];
      if (!(password == "") && !(telefono == "")) {
        //Ninguno esta vacio
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, async (err, hash) => {
            // Hash Password
            password = hash;
            // Save User
            connection.query(
              "UPDATE users SET `password`=?, `telefono`=? WHERE `email`=?",
              [password, telefono, email],
              function(error, results, fields) {
                connection.query(
                  "SELECT _id FROM users WHERE email=?",
                  [email],
                  function(error, results, fields) {
                    id_usuario = results;
                    console.log(id_usuario);
                    connection.query(
                      "UPDATE ciudadanos SET `telefono`=? WHERE `id_app`=? AND `aplicacion`='Antipanico'",
                      [telefono, id_usuario[0]._id],
                      function(error, results, fields) {
                        console.log(error);
                        res.end(JSON.stringify(results));
                      }
                    );
                  }
                );
                if (error) {
                  res.send(400, 400);
                } else {
                  res.send(201, 201);
                  res.end(JSON.stringify(results));
                }
              }
            );
          });
        });
      } else {
        //Si al menos uno de los dos tiene algo
        if (telefono == "") {
          //Si telefono esta vacio
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
              // Hash Password
              password = hash;
              // Save User
              connection.query(
                "UPDATE users SET `password`=? WHERE `email`=?",
                [password, email],
                function(error, results, fields) {
                  if (error) {
                    res.send(400, 400);
                  } else {
                    res.send(201, 201);
                    res.end(JSON.stringify(results));
                  }
                }
              );
            });
          });
        } else {
          //Quiere decir que password esta vacio
          connection.query(
            "UPDATE users SET `telefono`=? WHERE `email`=?",
            [telefono, email],
            function(error, results, fields) {
              connection.query(
                "SELECT _id FROM users WHERE email=? ",
                [email],
                function(error, results, fields) {
                  id_usuario = results;
                  console.log(id_usuario, telefono);
                  connection.query(
                    "UPDATE ciudadanos SET `telefono`=? WHERE `id_app`=? AND `aplicacion`='Antipanico'",
                    [telefono, id_usuario[0]._id],
                    function(error, results, fields) {
                      console.log(error);
                    }
                  );
                }
              );
              if (error) {
                res.send(400, 400);
              } else {
                res.send(201, 201);
              }
            }
          );
        }
      }
  });

  //Actualizar password de usuario
  server.post("/client_update_password", (req, res, next) => {
    var { email, uuidposteado, password } = req.body;
    console.log(password);
      connection.query(
        "SELECT uuid FROM users where email=?",
        [email],
        function(error, results, fields) {
            var arrayHolder = [];
            arrayHolder = results;
            const uuid = arrayHolder[0].uuid;
            console.log(uuid);
            console.log(uuidposteado);
            if (uuidposteado === uuid) {
              console.log("Las uuids coinciden, se puede cambiar la password");
              //Se cambia la password entonces
              bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, async (err, hash) => {
                  // Hash Password
                  password = hash;
                  console.log(password);
                  // Save User
                  connection.query(
                    "UPDATE users SET `password`=?, `uuid`=null WHERE `email`=?",
                    [password, email],
                    function(error, results, fields) {
                      if (error) {
                        res.send(400, 400);
                      } else {
                        res.send(201, 201);
                        res.end(JSON.stringify(results));
                      }
                    }
                  );
                });
              });
            } else {
              console.log(error);
              res.send(400, 400);
            }
        }
      );
  });

  // Enviar mail para cambiar contraseña
  server.post("/client_ask_for_update_password", function(req, res) {
    var { email } = req.body;
    console.log(email);
    connection.query(
      "SELECT habilitado FROM users where email=?",
      [email],
      function(error, results, fields) {
        var arrayHolder = [];
        arrayHolder = results;
        console.log(results);
        const habilitado = arrayHolder[0].habilitado;
        if (habilitado == 1){
          //generar uuid
          var uuidGenerado = uuid();
          console.log(uuidGenerado);
          //meter uuid en la columna
          connection.query(
            "UPDATE users SET `uuid`=? WHERE `email`=?",
            [
              uuidGenerado,
              email
            ],
            function(error, results, fields) {
              console.log(error);
            }
          );

          //enviar mail
          let transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              // should be replaced with real sender's account
              user: "municapitansarmiento@gmail.com",
              pass: "30999033691"
            }
          });
          let mailOptions = {
            // should be replaced with real recipient's account
            to: email,
            subject: "Antipanico Sarmiento - Cambio de contraseña",
            html:"<p>Se solicitó un cambio de contraseña para tu cuenta en nuestra app Antipanico Sarmiento. Si pensás que es un error o vos no solicitaste un cambio de contraseña, ignorá este mail. Sino, <a href='http://18.230.143.84/antipanico/index.php?email=" +email +"&uuid=" +uuidGenerado +"'>hacé click acá</a>.</p>"
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              res.send(400, 400);
              console.log("Cuenta inexistente");
            } else {
              res.send(201, 201);
            }
          });
        } else {
          res.send(400, 400);
          console.log("Cuenta inexistente");
        }
      }
    );
  });

  //Verificar si uuid es el del mail
  server.post("/client_verify_uuid", function(req, res) {
    var { uuidurl, email } = req.body;
    console.log(email);
    connection.query("SELECT uuid FROM users where email=?", [email], function(
      error,
      results,
      fields
    ) {
        var arrayHolder = [];
        arrayHolder = results;
        const uuid = arrayHolder[0].uuid;
        console.log(uuid);
        console.log(uuidurl);
        if (uuidurl === uuid) {
          res.send(201, 201);
          console.log("Las uuids coinciden, se puede cambiar la password");
        } else {
          console.log(error);
          res.send(400, 400);
        }
    });
  });

  //
  server.get("/pending_users", function(req, res) {
    connection.query(
      "SELECT COUNT(*) AS counted_users FROM users WHERE `habilitado`='0'",
      function(error, results, fields) {
        if (!error) {
          usersCount = {
            usersPending: results[0].counted_users
          };
          console.log("im counting");
          res.send(200, results);
        } else {
          res.send(400, "Hubo un error procesando la solicitud");
        }
      }
    );
  });

  //Validar usuario
  server.post("/client_validate", function(req, res) {
    var { email } = req.body;
    console.log(email);
    connection.query(
      "SELECT habilitado FROM users where email=?",
      [email],
      function(error, results, fields) {
          var arrayHolder = [];
          arrayHolder = results;
          const habilitado = arrayHolder[0].habilitado;
          if (habilitado == 1){
            res.send(200,200);
          }else{
            res.send(400, 400);
          }
      }
    );
  });

  server.get("/user_list", function(req, res) {
    connection.query("SELECT * FROM users ORDER BY habilitado ASC", function(
      error,
      results,
      fields
    ) {
      if (!error) {
        res.send(200, results);
      } else {
        res.send(400, "Hubo un error procesando la solicitud");
      }
      console.log(results);
    });
  });

  server.post("/client_get_user_info", function(req, res) {
    var { email } = req.body;
    connection.query(
      "SELECT nombre_completo, dni, telefono, fecha_nacimiento, sexo FROM users WHERE email=?",
      [email],
      function(error, results, fields) {
        //var obj = "'usuario':['{'nombre_completo': 'root', 'dni': '1000000', 'telefono': '2478666666', 'fecha_nacimiento': '2020-02-18T03:00:00.000Z', 'sexo': 'hombre'}]";

        if (!error) {
          res.send(200, results);
        } else {
          res.send(400, "Hubo un error procesando la solicitud");
        }
      }
    );
  });

  server.post("/client_get_ciudadano_info", function(req, res) {
    var { dni } = req.body;
    connection.query(
      "SELECT nombre, telefono, mail FROM ciudadanos WHERE dni=?",
      [dni],
      function(error, results, fields) {
        //var obj = "'usuario':['{'nombre_completo': 'root', 'dni': '1000000', 'telefono': '2478666666', 'fecha_nacimiento': '2020-02-18T03:00:00.000Z', 'sexo': 'hombre'}]";

        if (!error) {
          res.send(200, results);
        } else {
          res.send(400, "Hubo un error procesando la solicitud");
        }
      }
    );
  });

  server.get("/testUUID", function(req, res) {
    var idHolder = uuid();
    console.log(idHolder);
    res.send(idHolder);
  });

  server.post("/perimetral", function(req, res) {
    console.log(req.body);
    const { userState, email } = req.body;
    connection.query(
      "UPDATE users SET `perimetral`=? WHERE `email`=?",
      [userState, email],
      function(error, results, fields) {
        if (!error) {
          console.log("not so errors dsfagsdgawgsda");
          res.status(200).send("Usuario correctamente actualizado");
        } else {
          console.log("errors eassfsdfa", error);
          res.status(400).send("Hubo un error al actualizar al usuario");
        }
      }
    );
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

  //rest api to delete record from mysql database
  server.post("/delete_user", function(req, res) {

    var { email, _id } = req.body;

    connection.query(
      "DELETE FROM users WHERE `_id`=?",
      [_id],
      function(error, results, fields) {
        if (error) throw error;
        //enviar mail
        let transporter = nodeMailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            // should be replaced with real sender's account
            user: "municapitansarmiento@gmail.com",
            pass: "30999033691"
          }
        });
        let mailOptions = {
          // should be replaced with real recipient's account
          to: email,
          subject: "Antipanico Sarmiento - Cuenta eliminada",
          html:"<p>Su cuenta en nuestra app antipánico ha sido eliminada debido a un error en los datos que ha ingresado o por decisión del centro de monitoreo.</p><p>Si pensás que es un error, volvé a registrarte desde la app.</p><p>O hacé un reclamo en nuestra app de atención al vecino, en la categoría 'Sistemas'.</p>"
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.send(400, 400);
            console.log("Cuenta inexistente");
          } else {
            res.send(201, 201);
          }
        });
        connection.query("DELETE FROM ciudadanos WHERE `id_app`=?",
        [_id],
        function(error, response, fields){
          if(error){
            console.log(error)
            res.send(400, 400);
          }else{
            res.end("Record has been deleted!");
          }
        }
        );
      }
    );
  });
};

