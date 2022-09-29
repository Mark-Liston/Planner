var fetch = require("node-fetch");
var fs = require("fs");
var formidable = require("formidable");
const { request } = require("http");

function reqStart(request, response) {
	console.log("Request handler 'start' was called.");

	fs.readFile("./client/html/main.html", 'utf-8', (err, data)=>{
		if(!err){
			response.writeHead(200, { "Content-Type": "text/html" });
			response.write(data);
			response.end();
		} else{
			response.writeHead(404, { "Content-Type": "text/html" });
			response.write("Start file not found");
			console.log(err.message);
			response.end();
		}
	});
}

function reqFile(path, response){
	console.log("Request handler 'reqFile' was called");

	var ext = path.match("\.[a-z]+$");

	var fileType;

	switch(ext[0]){
		case ".js":
			fileType = "text/javascript";
			break;
		case ".css":
			fileType = "text/css";
			break;
		case ".png":
			fileType = "image/png";
			break;
		case ".jpg":
			fileType = "image/jpg";
			break;
		case ".ttf":
			fileType = "font/ttf";
			break;
	}

	fs.readFile(path, (err, data)=>{
		if(!err){
			console.log("File type is: "+fileType);
			console.log("Sending file: "+path);
			response.writeHead(200, { "Content-Type": (fileType)});
			response.end(data);
		} else{
			console.error("File \""+path+"\" not found!");
			response.writeHead(404, {"Content-Type" : "text/plain"});
			response.write("404:File not found");
			response.end();
		}
	});
}

exports.reqStart = reqStart;
exports.reqFile = reqFile;