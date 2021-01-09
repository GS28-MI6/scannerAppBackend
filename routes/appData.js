const mysql = require("mysql");
const config = require("../config");
const { uuid } = require("uuidv4");

module.exports = server => {
  var connection = config.db.get;

  server.post("/item", function(req, res) {

    var { barcode, id_cliente } = req.body

    console.log("hi there")
    connection.query("SELECT * FROM productos WHERE barcode=? AND cliente=?",[barcode, id_cliente], function(error, results, fields) {

      if (error){
        console.log(error)
      }
      console.log(results)
      res.send(JSON.stringify(results));
    });
  });

  server.post("/items", function(req, res) {

    console.log("hi there")
    connection.query("SELECT * FROM productos WHERE cliente=? ORDER BY stock DESC",[req.body.id_cliente], function(error, results, fields) {

      if (error){
        console.log(error)
      }
      console.log(results)
      res.send(JSON.stringify(results));
    });
  });

  server.post("/items_filtered", function(req, res) {

    var { nombre, tipo, id_cliente } = req.body

    console.log(nombre, tipo, "nombre y tipo")

    console.log("hi there")
    connection.query("SELECT * FROM productos WHERE nombre LIKE ? AND categoria LIKE ? AND cliente=? ORDER BY stock DESC",
    [
      '%' + nombre + '%',
      '%' + tipo + '%',
      id_cliente
    ],
    function(error, results, fields) {

      if (error){
        console.log(error)
      }
      console.log(results)
      res.send(JSON.stringify(results));
    });
  });

  server.post("/venta", function(req, res) {
    var uuidGenerado = uuid();
    var { total } = req.body.total
    var { id_cliente } = req.body
    
    connection.query(
      "INSERT INTO ventas SET id_ventas=?, total_venta=?, cliente=?",
      [
        uuidGenerado,
        total,
        id_cliente
      ],
      function(error, results, fields) {
        if (!error) {
          console.log("insertando nuevo")
          req.body.items.map(function(item){
            var { barcode, nombre, precio, cantidad, stock} = item
            connection.query(
              "UPDATE productos SET stock=? WHERE barcode=? AND cliente=?",
              [
                stock,
                barcode,
                id_cliente
              ],
              function(error, results, fields) {
                if (!error) {
                  console.log("updateando")
                  results.end()
                } else {
                  console.log("updateando error")
                  console.log(error);
                }
              }
            );
          });
          res.send(201, 201);
          res.end(JSON.stringify(results));
        } else {
          console.log(error, "im error");
          res.send(400, 400);
        }
      }
    );
  });

  server.post("/ingreso", function(req, res, next) {
    try {
      console.log(req.body)
      var { barcode, nombre, precio, stock, categoria, id_cliente} = req.body;

      barcode = parseInt(barcode)
      precio = parseFloat(precio).toFixed(2);
      stock =  parseInt(stock)

      console.log(precio, stock, barcode)

          connection.query("SELECT * FROM productos WHERE barcode=? AND cliente=?",[barcode, id_cliente], function(error, results, fields){
            console.log(results, "hi there")
            if (results[0] === undefined){
              connection.query(
                "INSERT INTO productos SET barcode=?, nombre=?, precio=?, stock=?, categoria=?, cliente=?",
                [
                  barcode,
                  nombre,
                  precio,
                  stock,
                  categoria,
                  id_cliente
                ],
                function(error, results, fields) {
                  if (!error) {
                    console.log("insertando nuevo")
                    res.send(201, 201);
                    res.end(JSON.stringify(results));
                  } else {
                    console.log(error);
                    res.send(400, 400);
                  }
                }
              );
            } else {
              connection.query(
                "UPDATE productos SET nombre=?, precio=?, stock=?, categoria=? WHERE barcode=? AND cliente=?",
                [
                  nombre,
                  precio,
                  stock,
                  categoria,
                  barcode,
                  id_cliente
                ],
                function(error, results, fields) {
                  if (!error) {
                    console.log("updateando")
                    res.send(201, 201);
                  } else {
                    console.log("updateando error")
                    console.log(error);
                    res.send(400, 400);
                  }
                }
              );
            }
          });
    } catch (error) {
      console.log(error);
      res.send(400, 400);
    }
  });

  server.post("/countFiltered", function(req, res) {

    const {id_cliente} = req.body

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
      function(error, results, fields) {
        if (error) throw error;
        console.log(results)
        res.send(200, results);
      }
    );
  });
};
