var fetch = require("node-fetch");
var fs = require("fs");
const { request } = require("http");
var formidable = require("formidable");

const database = require("./database.js");
const coursePlan = require("./coursePlan.js");

function reqStart(request, response) {
	console.log("Request handler 'start' was called.");

	fs.readFile("../client/html/main.html", 'utf-8', (err, data)=>{
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

function reqComplete(request, response)
{
    console.log("Request handler 'complete' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        (async function()
        {
            let parsedData = JSON.parse(data);
            database.getSuggestions(parsedData.type, "%" + parsedData.data + "%")
            .then(function(result)
            {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify(result));
            });
        })();
    });
}

function reqGetUnit(request, response)
{
    console.log("Request handler 'get unit' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        (async function()
        {
            let parsedData = JSON.parse(data);
            database.getUnit(parsedData.code)
            .then(function(result)
            {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify(result));
            })
            .catch(function(errorMsg)
            {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.end(errorMsg.toString());
            });
        })();
    });
}

function reqSubmit(request, response)
{
    console.log("Request handler 'submit' was called.");

    let form = new formidable.IncomingForm();
    form.parse(request, async function(error, field)
    {
        if (error)
        {
            console.error(error.message);
        }

        else
        {
            coursePlan.generatePlan(field)
            .then(function(plan)
            {
                database.saveCoursePlan(field.studentEmailInput, "Generated course plan", plan);
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify(plan));
            })
            .catch(errorMsg =>
            {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.end(errorMsg.toString());
            });
        }
    });
}

function reqRemoveDoneUnits(request, response)
{
    console.log("Request handler 'remove done units' was called.");
    
    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        let parsedData = JSON.parse(data);
        //console.log(parsedData);
        let doneUnits = [];

        let func = [];
        for (let doneUnit of parsedData.done_units)
        {
            func.push(new Promise(function(resolve, reject)
            {
                database.getUnit(doneUnit.code)
                .then(function(unit)
                {
                    doneUnits.push({"code": unit.code,
                        "name": unit.title,
                        "credit_points": unit.creditPoints,
                        "grade": doneUnit.grade});
                    resolve();
                })
                .catch(errorMsg =>
                {
                    reject(errorMsg);
                });
            }));
        }
        Promise.all(func).then(function()
        {
            console.log(doneUnits);
        })
        .catch(errorMsg => console.log(errorMsg));
    });

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end();
}

function reqViewPlan(request, response)
{
    console.log("Request handler 'viewPlan' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        let parsedData = JSON.parse(data);
        database.getCoursePlan(parsedData.email)
        .then(function(coursePlan)
        {
            if (coursePlan != null)
            {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify(coursePlan));
            }
            else
            {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.end("Course plan unavailable");
            }
        });
    });
}

function reqSavePlan(request, response){
	console.log("Request handler 'savePlan' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        let parsedData = JSON.parse(data);
		
		database.saveCoursePlan(parsedData.email, parsedData.changes, parsedData.plan)
		.then(() =>{
			response.writeHead(200);
			response.end();
		}).catch(()=>{
			response.writeHead(500, {"Content-Type": "text/plain"});
            response.end("Saving failed");
		});
	});
}

exports.reqStart = reqStart;
exports.reqFile = reqFile;
exports.reqComplete = reqComplete;
exports.reqGetUnit = reqGetUnit;
exports.reqSubmit = reqSubmit;
exports.reqRemoveDoneUnits = reqRemoveDoneUnits;
exports.reqViewPlan = reqViewPlan;
exports.reqSavePlan = reqSavePlan;