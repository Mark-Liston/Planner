// router.js

"use strict";

function route(handle, pathname, request, response)
{
    if (request.url.match("\.css$"))
    {
        pathname = "/style";
    }

    else if (request.url.includes("favicon"))
    {
        pathname = "/icon";
    }

    else if (request.url.match("\.js$"))
    {
        pathname = "/script";
    }

    else if (request.url.match("^\/images\/"))
    {
        pathname = "/images";
    }

    else if (request.url.match("^\/font\/"))
    {
        pathname = "/font";
    }

    else if (request.url.match("^\/templates\/"))
    {
        pathname = "/templates";
    }

    console.log("About to route a request for " + pathname);
    if (typeof handle[pathname] === 'function')
    {
        handle[pathname](request, response);
    }
    
    else
    {
        console.log("No request handler found for ", pathname);
        response.writeHead(404, {"Content-Type":"text/plain"});
        response.write("Error 404: Resource not found!");
        response.end();
    }
}

exports.route = route;
