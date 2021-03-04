const mysql = require("mysql");
const config = require("../config");
const { uuid } = require("uuidv4");

module.exports = (server) => {
  var connection = config.db.get;

  server.post("/item", function (req, res) {
    const { barcode, id_cliente } = req.body;
    console.log
    connection.query(
      "SELECT * FROM productos WHERE barcode=? AND cliente=?",
      [barcode, id_cliente],
      function (error, results, fields) {
        if (error) {
          res.status(200).send({
            ErrorCode: 400,
            Errors: ["El producto no existe en la base de datos"],
            Product: {},
          });
        } else {
          results["quantity"] = 1
          res
            .status(200)
            .send({ ErrorCode: 0, Errors: [], Product: results[0] });
        }
      }
    );
  });

  server.post("/categorias", function (req, res) {
    connection.query(
      "SELECT DISTINCT categoria FROM productos WHERE cliente=?",
      [req.body.id_cliente],
      function (error, results, fields) {
        if (error) {
          res.status(200).send({
            ErrorCode: 400,
            Errors: ["Fallo al obtener las categorías."],
            Productos: [],
          });
        } else {
          console.log("/categorias", results);
          res
            .status(200)
            .send({ ErrorCode: 0, Errors: [], Categorias: results });
        }
      }
    );
  });

  server.post("/productos", function (req, res) {
    const { nombre, tipo, id_cliente } = req.body;
    const nombreTipo =
      nombre && tipo
        ? "nombre LIKE '%" +
          nombre +
          "%' AND categoria LIKE '%" +
          tipo +
          "%' AND"
        : nombre
        ? "nombre LIKE '%" + nombre + "%' AND"
        : tipo
        ? "categoria LIKE '%" + tipo + "%' AND"
        : "";
    connection.query(
      "SELECT * FROM productos WHERE " +
        nombreTipo +
        " cliente=? ORDER BY stock DESC",
      [id_cliente],
      function (error, results, fields) {
        if (error) {
          res.status(200).send({
            ErrorCode: 400,
            Errors: ["Fallo al obtener los productos."],
            Productos: [],
          });
        } else {
          console.log("/productos", results);
          res
            .status(200)
            .send({ ErrorCode: 0, Errors: [], Productos: results });
        }
      }
    );
  });

  server.post("/venta", function (req, res) {
    var uuidGenerado = uuid();
    var { total } = req.body.total;
    var { id_cliente } = req.body;
    req.body.items.map(function (item) {
      var { barcode, nombre, precio, cantidad, stock } = item;
      connection.query(
        "INSERT INTO ventas_productos SET barcode=?, id_ventas=?, nombre=?, precio=?, cantidad=?, cliente=?",
        [barcode, uuidGenerado, nombre, precio, cantidad, id_cliente],
        function (error, results, fields) {
          if (!error) {
            cantidad = parseInt(cantidad);
            stock = parseInt(stock);
            console.log("insertando nuevo registro", stock, cantidad);
            if (cantidad > stock) {
              stock = 0;
            } else {
              stock = stock - cantidad;
            }
            console.log(stock);
            connection.query(
              "UPDATE productos SET stock=? WHERE barcode=? AND cliente=?",
              [stock, barcode, id_cliente],
              function (error, results, fields) {
                if (!error) {
                  console.log("updateando");
                } else {
                  res.status(200).send({
                    ErrorCode: 400,
                    Errors: ["Fallo al reducir el stock"],
                  });
                }
              }
            );
          } else {
            res.status(200).send({
              ErrorCode: 400,
              Errors: ["Fallo al insertar nueva venta"],
            });
          }
        }
      );
    });
    connection.query(
      "INSERT INTO ventas SET id_ventas=?, total_venta=?, cliente=?",
      [uuidGenerado, total, id_cliente],
      function (error, results, fields) {
        if (!error) {
          console.log("insertando nuevo");
          let jsonResponse = JSON.stringify(results);
          res
            .status(200)
            .send({ ErrorCode: 0, Errors: []});
        } else {
          res.status(200).send({
            ErrorCode: 400,
            Errors: ["Fallo al realizar la venta"],
          });
        }
      }
    );
  });

  server.post("/ingreso", function (req, res, next) {
    try {
      console.log(req.body);
      var { barcode, nombre, precio, stock, categoria, id_cliente } = req.body;

      barcode = parseInt(barcode);
      precio = parseFloat(precio).toFixed(2);
      stock = parseInt(stock);

      console.log(precio, stock, barcode);

      connection.query(
        "SELECT * FROM productos WHERE barcode=? AND cliente=?",
        [barcode, id_cliente],
        function (error, results, fields) {
          console.log(results, "hi there");
          if (results[0] === undefined) {
            connection.query(
              "INSERT INTO productos SET barcode=?, nombre=?, precio=?, stock=?, categoria=?, cliente=?",
              [barcode, nombre, precio, stock, categoria, id_cliente],
              function (error, results, fields) {
                if (!error) {
                  console.log("insertando nuevo");
                  let jsonResponse = JSON.stringify(results);
                  res.status(200).send({
                    ErrorCode: 0,
                    Errors: [],
                    Response: jsonResponse,
                  });
                } else {
                  res.status(200).send({
                    ErrorCode: 400,
                    Errors: ["Fallo al agregar un producto"],
                    Response: error,
                  });
                }
              }
            );
          } else {
            connection.query(
              "UPDATE productos SET nombre=?, precio=?, stock=?, categoria=? WHERE barcode=? AND cliente=?",
              [nombre, precio, stock, categoria, barcode, id_cliente],
              function (error, results, fields) {
                if (!error) {
                  console.log("updateando");
                  let jsonResponse = JSON.stringify(results);
                  res.status(200).send({
                    ErrorCode: 0,
                    Errors: [],
                    Response: jsonResponse,
                  });
                } else {
                  res.status(200).send({
                    ErrorCode: 400,
                    Errors: ["Fallo al actualizar el producto"],
                    Response: error,
                  });
                }
              }
            );
          }
        }
      );
    } catch (error) {
      res.status(200).send({
        ErrorCode: 401,
        Errors: ["Fallo al actualizar el producto"],
        Response: error,
      });
    }
  });

  server.post("/countFiltered", function (req, res) {
    const { id_cliente } = req.body;

    // var {tipo, desde, hasta} = req.body

    // if (desde === undefined || desde === ""){
    //   desde = "2019-12-10"
    // }
    // if(hasta === undefined || hasta === ""){
    //   hasta = new Date().toISOString().split('T')[0]
    // }

    connection.query(
      "SELECT SUM(total_venta) AS total_venta, DATE(fecha_venta) AS fecha_venta FROM scanner_app_db.ventas WHERE cliente=? group by DATE(fecha_venta) ORDER BY DATE(fecha_venta) ASC",
      [id_cliente],
      function (error, results, fields) {
        if (error) {
          res.status(200).send({
            ErrorCode: 400,
            Errors: ["Fallo al calcular las ventas"],
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
};
