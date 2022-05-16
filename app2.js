
const port = 9000;
var pabcexePath = "/opt/pabcnetc/pabcnetc.exe";

const { json } = require('express');
//const app = require('express');
const db = require('./database.js');
//const http = require('http').createServer(app);
//const wsServer = require('socket.io')(http);
const WebSocket = require('ws');
const { connect } = require('http2');
const wsServer = new WebSocket.Server({ port: port, 'Access-Control-Allow-Origin': "*" });


wsServer.on('connection', function connection(ws, req) {
  const ip = req.connection.remoteAddress.split(":").pop();//headers['x-forwarded-for'];
  console.log(ip);
});
/*wsServer.on('connection', function conn(req,res){
   res.writeHead(200, {
    'Set-Cookie': 'mycookie=test',
    'Content-Type': 'text/plain'
  });
});*/
wsServer.on('connection', onConnect);


async function onConnect(wsClient) {

    console.log('Новый пользователь');
    wsClient.send(JSON.stringify({action: "HELLO", data: 'Привет'}));

    wsClient.on('message', async function (message) {
        var startTime = Date.now();
        console.log(message);
        try {
            let jsonMessage;
            try {
                jsonMessage = JSON.parse(message);
            } catch (error) {
                console.log(error);
                jsonMessage = message;
            }
            
			console.log(jsonMessage);
            switch (jsonMessage.action) {
                case 'ECHO':
                    wsClient.send(jsonMessage.data);
                    break;

                case 'PING':
                    setTimeout(function () {
                        wsClient.send('PONG');
                    }, 2000);
                    break;

                case 'SIGNUP':
                    let new_hash = get_hash(jsonMessage.login, jsonMessage.password);
                    console.log('hash: ' + new_hash);

                    //add new user to db
                    db.query('insert into users (passhash, nickname, privileges) values ($1, $2, $3)', [new_hash, jsonMessage.login, 'student'])
                    console.log('getClient() = ' + db.getClient())
                    //addUser(jsonMessage.login, new_hash);
                    //break;
					
				case 'LOGIN':
                    let myhash = get_hash(jsonMessage.login, jsonMessage.password);
					console.log(`action: ${jsonMessage.action}, login: ${jsonMessage.login}, pass: ${jsonMessage.password}, tgz: ${jsonMessage.login+jsonMessage.password}, hash: ${myhash}`);
                    
                    /*let jsonData = readJson('/var/www/html/hashes.json');

                    function check_hash() {
                        //for (a of user_profile.users) { if (a.description === "facebook1") { return true; } else { return false; }; };
                        for (user in jsonData.users) {
                            if (user.hash === myhash.toString("hex")) {
                                return true;
                            }
                        }
                        return false;
                    };

                    //if (jsonData.forEach((elem,index) => { if (elem.hash === myhash.toString("hex")) { return true;}})) {
                    if (check_hash()) {
                        //correct login+pass
                        //send hash and lifetime in seconds for save this in cookie
                        wsClient.send(JSON.stringify({ action: "LOGIN_CORRECT", data: myhash.toString("hex"), lifetime: "" }));
                        console.log("login_correct" + login + password + hash);
                    }
                    else {
                        wsClient.send(JSON.stringify({ action: "LOGIN_INCORRECT", data: "" }));
                    }
                    //registration writeJson('/var/www/html/hashes.json', JSON.stringify());*/
                    break;

                case 'AUTH':
                    //let jsonData;
                    try {
                        jsonData = JSON.parse(readJson('/var/www/html/hashes.json'));
                    }
                    catch (e) {
                        console.log(`File Error: ${e}`);
                    }
                    jsonData.find(el => el.hash === jsonMessage.data);
                    break;

                case 'SAVEFILE':
                    var data = new String(jsonMessage.data);
                    break;

                case 'CODE':
		            const { exec } = require("child_process");
                    var data = new String(jsonMessage.data);
                    //var id = new String(jsonMessage.id);
                    console.log(data.toString());
                    var fileName = `p.pas`;
                    //exec("echo " + '"'+ data.toString() +'"'+ " > p.pas"
                    exec(`echo "${data.toString()}" > ./user_data/${jsonMessage.id}.pas`, (error, stdout, stderr) => {
    			        if (error) {
    			            console.log(`error: ${error.message}`);
			            }
                        if (stderr) {
    			            console.log(`stderr: ${stderr}`);

                        }
                        if (stdout) {
                            console.log(`stdout: ${stdout}`);
                        }
                    });

                    exec(`mono ${pabcexePath} /var/www/html/user_data/${jsonMessage.id}.pas /var/www/html/user_data/${jsonMessage.id}.exe`, (error, stdout, stderr) => {
    			        if (error) {
    			            console.log(`error: ${error.message}`);
    			            console.log(`stdout: ${stdout}`);
			                wsClient.send(stdout.slice(341));
			            }
			            if (stderr) {
    			            console.log(`stderr: ${stderr}`);

			            }
			            if (!error) {
                            exec(`mono /var/www/html/user_data/${jsonMessage.id}.exe`, (error, stdout, stderr) => {
    			                if (error) {
    				                console.log(`error: ${error.message}`);
			                    }
			                    if (stderr) {
    				                console.log(`stderr: ${stderr}`);
			                    }
			                    console.log(`stdout: ${stdout}`);
								wsClient.send(JSON.stringify({action: "COMPILER_ANSWER", data: stdout}));
			                    //wsClient.send(stdout);
			                });
			            }
		            });
                    break;
            }
        }   catch (error) {
                console.log('Ошибка: ', error);
        }

        const { exec } = require("child_process");
        console.log(`Сообщение обработана за: ${Date.now() - startTime} ms`)

    });
    wsClient.on('close', function() {
        console.log('Пользователь отключился');
    });
}

function get_hash(login, password) {
    const { SHA3 } = require('sha3');
    let hash = new SHA3(256);
    hash.update(login + password);
    return hash.digest({ buffer: Buffer.alloc(32), format: 'hex' });
}

function checkConnectToDatabase() {

}

function findUserInDatabase() {

}

/*function readJson(jsonPath) {
    const { readFile } = require('fs');
    let file = new readFile(jsonPath, (err, data) => {
        if (err) throw err;
        console.log("data: " + data);
        return data;
    });'/'

    let fs = require('fs');
    fs.access('/var/www/html/hashes.json', fs.F_OK, (err) => {
        if (err) {
            console.log("Error: "+err);
            console.log("Creating hashes.json");
            writeJson('/var/www/html/hashes.json', JSON.stringify({ "users": [{ "login": "asdf", "hash":"8248ba075fbea018d0e90f4596f86c737478e5217cdb9f758388d17ab552123d"}]}));
        }

        
    });
    //file exists
    /*fs.readFile(jsonPath, (err, data) => {
        if (err) throw err;
        console.log("data: " + JSON.parse(data).users[0]);
        return data;
    });'*'

    let data = fs.readFileSync(jsonPath);
    console.log(`data1: ${data} \ndata2: ${JSON.parse(data)}`);
    return data;
    
    //console.log('Data read from file ' + file);
    //return file;
}

function writeJson(jsonPath, jsonArray) {
    const { writeFile } = require('fs');
    let file = new writeFile(jsonPath, jsonArray, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });
}

function addUser(login, hash) {
    let jsonData = readJson('/var/www/html/hashes.json');
    console.log(`typeof: ${typeof (jsonData)} \ntypeof: ${typeof (JSON.parse(jsonData))} \njsonData: ${jsonData} \njsonData.users ${jsonData.users} \njsonData.users ${JSON.parse(jsonData).users} \njsonData.toString()${jsonData.toString()}`);
    //let jsonData = readJson('/var/www/html/hashes.json');
    JSON.parse(jsonData)['users'].push({ "login": login, "hash": hash, "files": [] });
    console.log('After writing: ' + jsonData + '\nAfter2: ' + JSON.parse(jsonData));
    writeJson('/var/www/html/hashes.json', JSON.stringify(jsonData));
}
*/

/*http.listen(port, () =>
  console.log(`Server listens http://:${port}`)
)*/
console.log(`Сервер запущен на ${port} порту`);
