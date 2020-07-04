const bcrypt = require("bcryptjs");
const config = require("./config");

exports.authenticate = (usuario, password) => {
  var connection = config.db.get;
  const plainPass = password;
  return new Promise(async (resolve, reject) => {
    try {
      // Get user by email
      var coincidentMailInfo = [];

      connection.query("select * from clientes WHERE `usuario`=?", usuario, function(err, rows) {
        if (err) {
          reject("Authentication Failed");
        } else {
          if (rows.length > 0) {
            coincidentMailInfo = rows;
            const userPass = coincidentMailInfo[0].contraseña;
            bcrypt.compare(plainPass, userPass, (err, isMatch) => {
              if (!isMatch) {
                reject("Authentication Failed");
              }else{
                data = {
                  id_cliente: coincidentMailInfo[0].id_cliente,
                  usuario: coincidentMailInfo[0].usuario,
                  email: coincidentMailInfo[0].email
                }
                const user = JSON.stringify(data);
                console.log(user);
                resolve(user);
              }
            });
          } else {
            reject("Authentication Failed");
          }
        }
      });
    } catch (err) {
      console.log(err);
      // Email not found or password did not match
      reject("Authentication Failed");
    }
  });
};
