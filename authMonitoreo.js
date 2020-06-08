const bcrypt = require("bcryptjs");
const config = require("./config");

exports.authenticate = (email, password) => {
  var connection = config.db.get;
  const plainPass = password;
  return new Promise(async (resolve, reject) => {
    try {
      // Get user by email
      var coincidentMailInfo = [];

      connection.query("select * from users_monitoreo WHERE `email`=?", email, function(err, rows) {
        if (err) {
          reject("Authentication Failed");
        } else {
          if (rows.length > 0) {
            coincidentMailInfo = rows;
            const userPass = coincidentMailInfo[0].password;
            bcrypt.compare(plainPass, userPass, (err, isMatch) => {
              if (!isMatch) {
                reject("Authentication Failed");
              }else{
                const user = JSON.stringify(coincidentMailInfo[0]);
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
