// server.js

var http = require("http");
var url = require("url");

function startServer(route, handle)
{
    function onRequest(request, response)
    {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(pathname, handle, request, response);
    }

    http.createServer(onRequest).listen(40018);
	console.log("===================");
    console.log("Server has started.");
	console.log('Current directory: ' + process.cwd());
	console.log("===================");
}

exports.startServer = startServer;
