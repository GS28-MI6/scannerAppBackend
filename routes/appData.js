const mysql = require("mysql");
const config = require("../config");
const { uuid } = require("uuidv4");

module.exports = server => {
  var connection = config.db.get;

  server.post("/item", function(req, res) {

    var { barcode } = req.body

    console.log("hi there")
    connection.query("SELECT * FROM productos WHERE barcode=?",[barcode], function(error, results, fields) {

      if (error){
        console.log(error)
      }
      console.log(results)
      res.send(JSON.stringify(results));
    });
  });

  server.post("/items", function(req, res) {

    console.log("hi there")
    connection.query("SELECT * FROM productos ORDER BY stock DESC", function(error, results, fields) {

      if (error){
        console.log(error)
      }
      console.log(results)
      res.send(JSON.stringify(results));
    });
  });

  server.post("/items_filtered", function(req, res) {

    var { nombre, tipo } = req.body

    console.log(nombre, tipo, "nombre y tipo")

    nombre = ""

    console.log("hi there")
    connection.query("SELECT * FROM productos WHERE nombre LIKE ? ORDER BY stock DESC",
    [
      '%' + nombre + '%',
      '%' + tipo + '%'
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
    req.body.items.map(function(item){
      var { barcode, nombre, precio, cantidad, stock } = item
      connection.query(
        "INSERT INTO ventas_productos SET barcode=?, id_ventas=?, nombre=?, precio=?, cantidad=?",
        [
          barcode,
          uuidGenerado,
          nombre,
          precio,
          cantidad
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
              "UPDATE productos SET stock=? WHERE barcode=?",
              [
                stock,
                barcode
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
      "INSERT INTO ventas SET id_ventas=?, total_venta=?",
      [
        uuidGenerado,
        total
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
      var { barcode, nombre, precio, stock, categoria } = req.body;

      barcode = parseInt(barcode)
      precio = parseFloat(precio).toFixed(2);
      stock =  parseInt(stock)

      console.log(precio, stock, barcode)

          connection.query("SELECT * FROM productos WHERE barcode=?",[barcode], function(error, results, fields){
            console.log(results, "hi there")
            if (results[0] === undefined){
              connection.query(
                "INSERT INTO productos SET barcode=?, nombre=?, precio=?, stock=?, categoria=?",
                [
                  barcode,
                  nombre,
                  precio,
                  stock,
                  categoria
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
                "UPDATE productos SET nombre=?, precio=?, stock=?, categoria=? WHERE barcode=?",
                [
                  nombre,
                  precio,
                  stock,
                  categoria,
                  barcode
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

    var {tipo, desde, hasta} = req.body

    if (desde === undefined || desde === ""){
      desde = "2019-12-10"
    }
    if(hasta === undefined || hasta === ""){
      hasta = new Date().toISOString().split('T')[0]
    }


    connection.query(
      "SELECT COUNT(*) AS tipo, DATE(ingreso) AS dia FROM alertas WHERE tipo = ? AND ingreso >= ? AND ingreso <= ? GROUP BY DATE(ingreso)",
      [tipo, desde, hasta],
      function(error, results, fields) {
        if (error) throw error;
        console.log(results)
        res.send(200, results);
      }
    );
  });
};
