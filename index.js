// index.js

"use strict";

var server = require("./js/server");
var router = require("./js/router");
var requestHandlers = require("./js/requestHandlers");

// create ‘handle’ object literal
var handle = {};

// using the associative array notation, each array
// index is an object property which points to an
// appropriate request handler
handle["/"] = requestHandlers.reqStart;
handle["/start"] = requestHandlers.reqStart;
handle["/style"] = requestHandlers.reqStyle;
handle["/icon"] = requestHandlers.reqIcon;
handle["/script"] = requestHandlers.reqScript;
handle["/submit"] = requestHandlers.reqSubmit;

// pass handle object (and route function) to server
server.startServer(router.route, handle);
