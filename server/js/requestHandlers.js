// requestHandlers.js

"use strict";

let database = require("./database.js");
const coursePlan = require("./coursePlan.js");

const scrape = require("./scrape.js");

var fs = require("fs");
var formidable = require("formidable");
let util = require("util");
// var http = require("http");

function send404(response)
{
    response.writeHead(404, {"Content-Type":"text/plain"});
    response.end("Error 404: Resource not found.");
}

// Sends HTML file to client.
function reqStart(request, response)
{
    fs.readFile("../client/html/main.html", function(error, html)
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
    fs.readFile("../client/css/" + request.url, function(error, style)
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

    let readStream = fs.createReadStream("../client/images/favicon.png");
    response.writeHead(200, {"Content-Type": "image/png"});
    readStream.pipe(response);
}

// Sends requested JavaScript file to client.
function reqScript(request, response)
{
    fs.readFile("../client/js/" + request.url, function(error, js)
    {
        if (error)
        {
            console.log(error);
            send404(response);
        }

        else
        {
            console.log("Request handler 'script' was called.");

            response.writeHead(200, {"Content-Type": "text/javascript"});
            response.end(js);
        }
    });
}

function reqImage(request, response)
{
    console.log("Request handler 'images' was called.");

    let readStream = fs.createReadStream("../client" + decodeURI(request.url));

    readStream.on("open", function(error)
    {
        response.writeHead(200, {"Content-Type": "image/png"});
        readStream.pipe(response);
    });

    readStream.on("error", function(error)
    {
        console.log(error);
        send404(response);
    });
}

// Sends requested font file to client.
function reqFont(request, response)
{
    fs.readFile("../client/" + decodeURI(request.url), function(error, font)
    {
        if (error)
        {
            console.log(error);
            send404(response);
        }

        else
        {
            console.log("Request handler 'font' was called.");

            response.writeHead(200, {"Content-Type": "font/ttf"});
            response.end(font);
        }
    });
}

// Sends requested template html file to client.
function reqTemplate(request, response)
{
    fs.readFile("../client/" + decodeURI(request.url), function(error, template)
    {
        if (error)
        {
            console.log(error);
            send404(response);
        }

        else
        {
            console.log("Request handler 'templates' was called.");

            response.writeHead(200, {"Content-Type": "text/html"});
            response.end(template);
        }
    });
}

function reqComplete(request, response)
{
    console.log("Request handler 'complete' was called.");

    let data = [];
    request.on("data", function(chunk)
    {
        data.push(chunk);
    });
    request.on("end", function()
    {
        data = Buffer.concat(data).toString();

        (async function()
        {
            console.log("about to search");
            let result = await scrape.searchHandbook(data, new Date().getFullYear(), ["murdoch_pcourse"], 10);

            if (result.length > 0)
            {
                for (let item of result)
                {
                    console.log(item.code);
                }
            }
        })();

        console.log(data);
        
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end(data);
    });

    //console.log(data);
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
                response.writeHead(200, {"Content-Type": "text/plain"});
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

exports.reqStart = reqStart;
exports.reqStyle = reqStyle;
exports.reqIcon = reqIcon;
exports.reqScript = reqScript;
exports.reqImage = reqImage;
exports.reqFont = reqFont;
exports.reqTemplate = reqTemplate;
exports.reqComplete = reqComplete;
exports.reqSubmit = reqSubmit;
