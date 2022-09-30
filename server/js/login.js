const bcrypt = require('bcrypt');
const db = require("./database");

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

async function login(req, res) {
    if (req.method == "POST") {
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
                console.log(email + " logged in");

                res.writeHead(200, { "Content-Type": "text/json"});
                res.write(JSON.stringify({
                    username: userInfo.username
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
            // Create salt
            const salt = bcrypt.genSaltSync(10);
            
            // Create hash
            let hashPwd = bcrypt.hashSync(password, salt);

            db.createAccount(email, username, hashPwd);

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
    // TODO - Not implemented, should destroy provided sessionID
}

exports.login = login;
exports.register = register;
exports.logout = logout;
