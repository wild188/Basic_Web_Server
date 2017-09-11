// ----------------------------------------------------------------------------------
//                                  Module section
// using http and fs modules
var http = require('http');
var fs = require('fs');
var url = require('url');
var RSVP = require('rsvp');
var qs = require('querystring');
var request = require('request');
//var GoogleAuth = require('google-auth-library');
//var authG = require('./config/auth.js');
// Database connection
//var dbManager = require('./dbManager.js');

// --------------------------------------------------------------------------------
//                              Server and port setup
// The server will listen on port 3000 and will route requests to request handler
const PORT = 3000;
var server = http.createServer(requestHandler);
server.listen(PORT, function () {
    console.log("Listening on port 3000");
    
});


// ----------------------------------------------------------------------------------
//                                  Routing info
// The request handler function
function requestHandler(req, res) {
    //dbManager.dbConnect();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    var method = req.method;
    console.log(req.url + " : " + method);
    switch (method) {
        case "GET":
            getHandler(req, res);
            break;
        case "POST":
            postHandler(req, res);
            break;
        case "PUT":
            putHandler(req, res);
            break;
        case "DELETE":
            deleteHandler(req, res);
            break;
        default:
            break;
    }
}

// GET handler
function getHandler(req, res) {
    var parts = url.parse(req.url, true);
    var target = parts.pathname; //the method name to be called
    var params = parts.query; //the paramaters to call the method with
    switch (target) {
        case "test":
            console.log("GET: Test request recieved.");
            break;
        default:
            var errMessage = "No matching target function for: " + target;
            console.log(errMessage);
            failedResponse(res, 500, errMessage);
    }
}

function postHandler(req, res) {
    var parts = url.parse(req.url, true);
    var target = parts.pathname; //the method name to be called
    var params = parts.query; //the paramaters to call the method with
    switch (target) {
        case "/authToken":
            getBody(req, res, verifyToken);
            break;
        default:
            var errMessage = "No matching target function for: " + target;
            console.log(errMessage);
            failedResponse(res, 500, errMessage);
    }
}

function getBody(req, res, callback) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        //var bodyJson = qs.parse(body);
        //console.log('body is: ' + bodyJson);
        callback(req, res, body);
    });
}

function verifyToken(req, res, bodJson) {
    var bodyJson = qs.parse(bodJson);
    var token = bodyJson.idtoken;
    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + token, (error, response, body) => {
        if (error) {
            console.log('ERROR from google auth servers: ' + error);
        }
        var JSONBody = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            var name, email, picture, profile, profileCheck, token;
            // Show the HTML for the Google homepage.
            // still need to check aud field to see if it matches the client ID
            if (JSONBody.aud == authG.googleAuth.clientID) {
                //for later implementation check if token is going to expire soon and if it does then refresh
                name = JSONBody.name;
                email = JSONBody.email;
                token = JSONBody.sub;
                picture = JSONBody.picture;
                //need to check database to see if this is a valid admin
                res.writeHead(200);
                res.end(token);
            }

        }
    });
}

function successResponse(res, data, message) {
    message = message || 'Default server success message.';
    console.log("Sending request successResponse with data: " + data[0]);
    //var body = JSON.stringify(data);
    //console.log(body);
    res.writeHead(200, {
        //'Content-Length': Buffer.byteLength(body),
        'contenType': 'text/json'
    });
    res.write(data);
    if (!data) {
        res.end(message);
    } else {
        res.end()
    }
    console.log(message);

}

function failedResponse(res, code, message) {
    message = message || "Request failed";
    res.writeHead(code);
    res.end(message)
}

//-----------------------------------------------------------------------------------
// do app specific cleaning before exiting

// process.on('exit', function () {
//     console.log("Process killed by exit signal");
//     dbManager.closeCon();
//     process.exit();
// });

//exit DB on ctl+c 

process.on('SIGINT', function () {
    console.log("Process killed by SIGINT signal");
    //dbManager.closeCon();
    process.exit();
});

process.on('SIGTERM', function () {
    console.log("Process killed by SIGTERM signal");
    //dbManager.closeCon();
    process.exit();
});
