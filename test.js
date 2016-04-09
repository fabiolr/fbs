var http = require('http');
var d = new Date();

function getTime() {

	var d = new Date();
  		var dh = d.getHours();
  		var dm = d.getMinutes();
  		dm = (dm > 10) ? dm : '0'+dm;
  		var mtime = dh + ':' + dm;

  		return mtime;
}


http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('testing. . .\n' + getTime());
}).listen(3001);

console.log('Server running at port 3001');  