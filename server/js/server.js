// server.js

var https = require('https');
var url = require("url");
var fs = require('fs');


const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };
  

function startServer(route, handle)
{
    function onRequest(request, response)
    {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(pathname, handle, request, response);
    }

    https.createServer(options,onRequest).listen(80);
	console.log("===================");
    console.log("Server has started.");
	console.log('Current directory: ' + process.cwd());
	console.log("===================");
}

exports.startServer = startServer;
