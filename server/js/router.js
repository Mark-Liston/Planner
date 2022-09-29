// create route function with pathname as parameter
function route(pathname, handle, request, response) {
	console.log("Routing a request for " + pathname);

	if(typeof handle[pathname] === 'function'){ //If the pathname points to a function, call said function
		handle[pathname](request, response);
	} else{
		handle["/reqFile"](("./client"+decodeURI(pathname)), response);
	}
}

exports.route = route;
