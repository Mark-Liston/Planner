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
	    coursePlan.assignAdvancedStanding(parsedData);
        coursePlan.removeDoneUnits(parsedData)
        .then(function(plan)
        {
            if (parsedData.email != null)
            {
                database.saveCoursePlan(parsedData.email, "Added completed units", plan);
            }
            response.writeHead(200, {"Content-Type": "application/json"});
            response.end(JSON.stringify(plan));
        });      
    });
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
        database.getCoursePlan(parsedData.username)
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

function reqGetEmail(request, response)
{
    console.log("Request handler 'getEmail' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        let username = JSON.parse(data).username;
	    
	database.getEmail(username)
	.then(function(result)
	{
            if (result != null)
	    {
                response.writeHead(200, {"Content-Type": "text/plan"})
		response.end(result.email);
            }
	    else
	    {
                response.writeHead(404, {"Content-Type": "text/plan"});
		response.end("An email corresponding to the input username could not be found");
	    }
	})
    });
}

function reqGetUsername(request, response)
{
    console.log("Request handler 'getUsername' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        let email = JSON.parse(data).email;
	    
        database.getUsername(email)
        .then(function(result)
        {
            if (result != null)
            {
                response.writeHead(200, {"Content-Type": "text/plan"})
                response.end(result.username);
            }
            else
            {
                response.writeHead(404, {"Content-Type": "text/plan"});
                response.end("A username corresponding to the input email could not be found");
            }
        })
    });
}

function reqAddUnit(request, response)
{
    console.log("Request handler 'addUnit' was called.");

    let data = "";
    request.on("data", function(chunk)
    {
        data += chunk;
    });
    request.on("end", function()
    {
        let parsedData = JSON.parse(data);

        coursePlan.addUnit(parsedData.unit, parsedData.course_plan)
        .then(function()
        {
            /*for (let item of parsedData.course_plan.planned_units)
            {
                console.log(item.code);
            }*/

            response.writeHead(200, {"Content-Type": "text/plan"})
            response.end(JSON.stringify(parsedData.course_plan));
        })
        .catch(function(errorMsg)
        {
            response.writeHead(404, {"Content-Type": "text/plan"});
            response.end(errorMsg.toString());
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
exports.reqGetEmail = reqGetEmail;
exports.reqGetUsername = reqGetUsername;
exports.reqAddUnit = reqAddUnit;
