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
    req.body.items.map(function(item){
      var { barcode, nombre, precio, cantidad, stock} = item
      connection.query(
        "INSERT INTO ventas_productos SET barcode=?, id_ventas=?, nombre=?, precio=?, cantidad=?, cliente=?",
        [
          barcode,
          uuidGenerado,
          nombre,
          precio,
          cantidad,
          id_cliente
        ],
        function(error, results, fields) {
          if (!error) {
            cantidad = parseInt(cantidad)
            stock = parseInt(stock)
            console.log("insertando nuevo", stock, cantidad)
            if(cantidad > stock){
              stock = 0
            } else {
              stock = stock - cantidad
            }
            console.log(stock)
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
                } else {
                  console.log("updateando error")
                  console.log(error);
                }
              }
            );
          } else {
            console.log(error);
          }
        }
      );
    })
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
          res.send(201, 201);
          res.end(JSON.stringify(results));
        } else {
          console.log(error);
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

          connection.query("SELECT * FROM productos WHERE barcode=?",[barcode], function(error, results, fields){
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

  server.post("/count", function(req, res) {

    var { desde, hasta } = req.body

    if (desde === undefined || desde === ""){
      desde = "2019-12-10"
    }
    if(hasta === undefined || hasta === ""){
      hasta = new Date().toISOString().split('T')[0]
    }

    console.log(desde, hasta)

    connection.query("SELECT COUNT(*) AS total_alertas FROM alertas WHERE ingreso >= ? AND ingreso <= ?",
    [desde,hasta],
     function(
      error,
      results,
      fields
    ) {
      var total = results;
      if (error) throw error;
      console.log(error, results);
      connection.query(
        "SELECT tipo,COUNT(*) AS all_alertas FROM alertas WHERE ingreso >= ? AND ingreso <= ? GROUP BY tipo ORDER BY tipo ASC",
        [desde,hasta],
        function(err, ress, field) {
          console.log(ress);
          var alertsCount = {
            total: total[0].total_alertas,
            accidente_vial: 0,
            bomberos: 0,
            disturbios: 0,
            robo: 0,
            salud: 0,
            violencia_genero: 0
          };
          ress.map(function(alert) {
            console.log(alert);
            switch (alert.tipo) {
              case "Accidente Vial":
                alertsCount.accidente_vial = alert.all_alertas;
                break;
              case "Bomberos":
                alertsCount.bomberos = alert.all_alertas;
                break;
              case "Disturbios":
                alertsCount.disturbios = alert.all_alertas;
                console.log(alertsCount);
                break;
              case "Robo":
                alertsCount.robo = alert.all_alertas;
                break;
              case "Salud":
                alertsCount.salud = alert.all_alertas;
                console.log(alertsCount);
                break;
              case "Violencia de Género":
                alertsCount.violencia_genero = alert.all_alertas;
                break;
              default:
                console.log("default");
                break;
            }
          });
          res.send(200, alertsCount);
        }
      );
    });
  });

  server.post("/countFiltered", function(req, res) {

    // var {tipo, desde, hasta} = req.body

    // if (desde === undefined || desde === ""){
    //   desde = "2019-12-10"
    // }
    // if(hasta === undefined || hasta === ""){
    //   hasta = new Date().toISOString().split('T')[0]
    // }

    connection.query(
      "SELECT SUM(total_venta) AS total_venta, DATE(fecha_venta) AS fecha_venta FROM scanner_app_db.ventas group by DATE(fecha_venta) ORDER BY DATE(fecha_venta) ASC",
      function(error, results, fields) {
        if (error) throw error;
        console.log(results)
        res.send(200, results);
      }
    );
  });
};
