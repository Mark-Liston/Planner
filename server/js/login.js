const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require("./database");
const sessions = {};

// Check in 5 mins interval, destroy sessions that have expired
setInterval(() => {
    const currentTime = new Date;
    for (const key in sessions) {
        // check if session has expired
        if (sessions[key].expires < currentTime) {
            delete sessions[key];
        }
    }
}, 5 * 60000);

async function getRequestData(req) {
    const buffers = [];

    for await (const chunk of req) {
        buffers.push(chunk);
    }

    // Combine all data into string
    return Buffer.concat(buffers).toString();
}

function parseForm(data) {
    let result = {};

    let parts = data.split('&');
    for (let part of parts) {
        let separatorIndex = part.indexOf('=');
        if (separatorIndex != -1) {
            result[part.slice(0,separatorIndex)] = decodeURIComponent(part.slice(separatorIndex+1));
        }
    }

    return result;
}

function parseCookies(req) {
    const list = {};
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

function checkSession(req,res) {
    let cookies = parseCookies(req);
    if (cookies.sessionID != undefined && sessions[cookies.sessionID] != undefined){
        req.session = sessions[cookies.sessionID];
    }
}


async function login(req, res) {
    if (req.method == "POST") {
        checkSession(req,res);

        // User is already logged in
        if (req.session?.email != undefined) {
            res.writeHead(200, { "Content-Type": "text/json"});
            res.write(JSON.stringify({
                'username': req.session.username,
                'sessionID': req.session.sessionID,
                'email': req.session.email
            }));
            res.end();
            return;
        }

        // Capture form submitted data
        const data = await getRequestData(req);

        // Parse form data into usable format
        let {email, password} = parseForm(data);
    
        // Get user account
        let userInfo = await db.getAccount(email);
        if (userInfo == undefined) {
            res.writeHead(401, { "Content-Type": "text/json"});
			res.write('{"reason": "Invalid Email"}');
            res.end();
            console.log("Account doesn't exist")
        } else {
            // Check if hashes are correct
            if (bcrypt.compareSync(password, userInfo.password)) {
                // Passwords matched

                // Generate unique id
                const sessionID = crypto.randomBytes(48).toString('hex');
                while (sessions[sessionID] != undefined) {
                    sessionID = crypto.randomBytes(48).toString('hex');
                }

                sessions[sessionID] = {
                    'username': userInfo.username,
                    'email': userInfo.email,
                    'sessionID': sessionID,
                    'expires': new Date((new Date).getTime() + 60 * 60000) // Expires in 1 hour
                }

                console.log(email + " logged in");

                res.writeHead(200, { "Content-Type": "text/json"});
                res.write(JSON.stringify({
                    username: userInfo.username,
                    email: userInfo.email,
                    sessionID: sessionID
                }));
                res.end();
            } else {
                // Passwords didn't match
                console.log(email + " login attempt, password was incorrect");

                res.writeHead(401, { "Content-Type": "text/json"});
                res.write('{"reason": "Invalid Password"}');
                res.end();
            }
        }
    } else {
        // Get request, redirect to home
        res.writeHead(302, {
            'Location': './'
          });
        res.end();
    }
}

async function register(req,res) {
    if (req.method == "POST") {
        // Capture form submitted data
        const data = await getRequestData(req);

        // Parse form data into usable format
        let {email, password, username} = parseForm(data);

        // Check if user already exists
        let userInfo = await db.getAccount(email);
        if (userInfo == undefined) {
            db.createAccount(email, username, password);

            res.writeHead(200, { "Content-Type": "text/json"});
            res.write('{"success": true}');
            res.end();
        } else {
            // Bad request account already exists
            res.writeHead(403, { "Content-Type": "text/json"});
            res.write('{"reason": "Account already exists"}');
            res.end();
        }
    } else {
        // Get request, redirect to home
        res.writeHead(302, {
            'Location': './'
          });
        res.end();
    }
}


function logout(req, res) {
    checkSession(req,res);

    // Destroy session if it exists
    if (req.session?.email != undefined) {
        let sessionID = req.session.sessionID;
        delete sessions[sessionID];
        req.session = undefined;
    }

    // Redirect to home
    res.writeHead(302, {
        'Location': './'
      });
    res.end();
}

exports.login = login;
exports.register = register;
exports.logout = logout;
exports.checkSession = checkSession;
