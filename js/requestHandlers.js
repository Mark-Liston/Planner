// requestHandlers.js

"use strict";

var fs = require("fs");
var formidable = require("formidable");
// var url = require("url");
var http = require("http");

function send404(response)
{
    response.writeHead(404, {"Content-Type":"text/plain"});
    response.end("Error 404: Resource not found!");
}

// Sends HTML file to client.
function reqStart(request, response)
{
    fs.readFile("./html/index.html", function(error, html)
    {
        if (error)
        {
            console.log(error);
            send404(response);
        }

        else
        {
            console.log("Request handler 'start' was called.");

            response.writeHead(200, {"Content-Type": "text/html"});
            response.end(html);
        }
    });
}

// Sends CSS file to client.
function reqStyle(request, response)
{
    fs.readFile("." + request.url, function(error, style)
    {
        if (error)
        {
            console.log(error);
            send404(response);
        }

        else
        {
            console.log("Request handler 'style' was called.");

            response.writeHead(200, {"Content-Type": "text/css"});
            response.end(style);
        }
    });
}

// Sends favicon to client.
function reqIcon(request, response)
{
    console.log("Request handler 'icon' was called.");

    let readStream = fs.createReadStream("./images/favicon.png");
    response.writeHead(200, {"Content-Type": "image/png"});
    readStream.pipe(response);
}

// Sends requested JavaScript file to client.
function reqScript(request, response)
{
    fs.readFile("." + request.url, function(error, js)
    {
        if (error)
        {
            console.log(error);
            send404(response);
        }

        else
        {
            console.log("Request handler 'script' was called.");

            response.writeHead(200, {"Content-Type": "text/html"});
            response.end(js);
        }
    });
}

function reqSubmit(request, response)
{
    console.log("Request handler 'submit' was called.");
    console.log("... about to parse ...");

    let form = new formidable.IncomingForm();
    form.parse(request, function(error, field)
    {
        console.log("parsing done");

       // // Gets data from file for specified year.
       // downloadFile(field.year, function(data, error)
       // {
       //     if (error)
       //     {
       //         console.log(error);
       //         response.writeHead(400, {"Content-Type":"text/plain"});
       //         response.end("Error 400: Invalid form submission!");
       //     }

       //     else
       //     {
       //         // Extracts relevant measures from weather data, aggregated by month.
       //         parseWeatherData(data, field.measurement, function(weatherData)
       //         {
       //             response.writeHead(200, {"Content-Type": "application/json"});
       //             response.end(JSON.stringify(weatherData));
       //         });
       //     }
       // });
    });
}

exports.reqStart = reqStart;
exports.reqStyle = reqStyle;
exports.reqIcon = reqIcon;
exports.reqScript = reqScript;
exports.reqSubmit = reqSubmit;
