const errors = require("restify-errors");
const rjwt = require("restify-jwt-community");
const Customer = require("../models/Customer");
const mysql = require("mysql");
const config = require("../config");

module.exports = server => {
  var connection = config.db.get;

  // Get Customers
  server.get("/customers", async (req, res, next) => {
    connection.query("SELECT * FROM customers", function(
      error,
      results,
      fields
    ) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    });
  });

  // Get Single Customer
  server.get("/customers/:id", async (req, res, next) => {
    connection.query(
      "SELECT * FROM customers where _id=?",
      [req.params.id],
      function(error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results));
      }
    );
  });

  // Add Customer
  server.post(
    "/customers",
    rjwt({ secret: config.JWT_SECRET }),
    async (req, res, next) => {
      // Check for JSON
      if (!req.is("application/json")) {
        return next(
          new errors.InvalidContentError("Expects 'application/json'")
        );
      }

      var postData = req.body;
      connection.query("INSERT INTO customers SET ?", postData, function(
        error,
        results,
        fields
      ) {
        if (error) throw error;
        res.end(JSON.stringify(results));
      });
    }
  );

  // Update Customer
  server.put(
    "/customers/:id",
    rjwt({ secret: config.JWT_SECRET }),
    async (req, res, next) => {
      connection.query(
        "UPDATE `customer` SET `name`=?,`email`=?,`dni`=? where `_id`=?",
        [req.body.name, req.body.email, req.body.dni, req.body._id],
        function(error, results, fields) {
          if (error) throw error;
          res.end(JSON.stringify(results));
        }
      );
    }
  );

  // Delete Customer
  server.delete(
    "/customers/:id",
    rjwt({ secret: config.JWT_SECRET }),
    async (req, res, next) => {
      connection.query(
        "DELETE FROM `app_data` WHERE `id`=?",
        [req.params.id],
        function(error, results, fields) {
          if (error) throw error;
          res.end("Record has been deleted!");
        }
      );
    }
  );
};
