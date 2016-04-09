var http = require('http');
var d = new Date();

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('testing. . .\n' + d);
}).listen(3001);

console.log('Server running at port 3001');  