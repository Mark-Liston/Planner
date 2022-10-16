// index.js

var server = require("./js/server");
var router = require("./js/router");
var requestHandlers = require("./js/requestHandlers");
var loginHandlers = require("./js/login");

// create ‘handle’ object literal
var handle = {};

// using the associative array notation, each array
// index is an object property which points to an
// appropriate request handler
handle["/"] = requestHandlers.reqStart;
handle["/start"] = requestHandlers.reqStart;
handle["/reqFile"] = requestHandlers.reqFile;

// login.js handles
handle["/login"] = loginHandlers.login;
handle["/register"] = loginHandlers.register;
handle["/logout"] = loginHandlers.logout;

//Course Handlers
handle["/complete"] = requestHandlers.reqComplete;
handle["/getUnit"] = requestHandlers.reqGetUnit;
handle["/submit"] = requestHandlers.reqSubmit;

// pass handle object (and route function) to server
server.startServer(router.route, handle);
