const mysql = require("mysql");
const config = require("../config");

module.exports = server => {
  var connection = config.db.get;

  function EventsHandler(req, res, next){
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    const newClient = {
      id: clientId,
      res
    };
    clients.push(newClient);

    req.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clients = clients.filter(c => c.id !== clientId);
    });
  }

  function sendEventsToAll(data) {
    clients.forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`))
  }

  server.get("/empleos", function(req, res) {
    connection.query("SELECT * FROM empleos", function(
      error,
      results,
      fields
    ) {
      if (!error){
        var searchData = []
        results.map(function(obj){
            var namePusher = {
                "key": obj.nombre_empleo,
                "value": obj.nombre_empleo
            }
            var empPusher = {
                "key": obj.empresa,
                "value": obj.empresa
            }
            searchData.push(namePusher)
            searchData.push(empPusher)
        })
        var separator = {
            "results": results,
            "searchData": searchData
        }
        res.send(separator);
      console.log(separator);
      } else {
          console.log(error)
      }
    });
  });

  server.post("/checker", function(req, res) {
      var { busqueda } = req.body
      console.log(busqueda)
    connection.query("SELECT * FROM empleos WHERE nombre_empleo LIKE ? OR empresa LIKE ? OR tags LIKE ?", [busqueda, busqueda, busqueda], function(
      error,
      results,
      fields
    ) {
      if (!error){
        res.send(results);
        console.log(results);
      } else{
          console.log(error)
      }
    });
  });
  
  let clients = [];

  server.get('/searchEvents', EventsHandler);
}