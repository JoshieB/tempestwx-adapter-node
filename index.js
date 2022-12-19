const dotenv = require('dotenv').config();
const crypto = require('crypto');
const WebSocketClient = require('websocket').client;
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let weatherDB = new sqlite3.Database("./db/weatherflow.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, e => {
    if (e){
        console.log("Error creating or opening the database.");
    } else {
        console.log("Something positive has happened with regards to the database.");
    }
});

weatherDB.serialize(() => {
    // There were multiple statements. No longer a need for serialize.
    weatherDB.run("CREATE TABLE IF NOT EXISTS unparsed_observation_data (data TEXT)")
})

let client = new WebSocketClient();

function connectAndListen(){
    client.on('connectFailed', e => {
        console.log(`Websocket connection error: ${e.toString()}`);
    })

    client.on('connect', connection => {
        console.log('connected');

        connection.on('error', e => {
            console.log(`Websocket Connection Error: ${e.toString()}`);
        });

        connection.on('close', () => {
            console.log('Connection closed. Will try to connect again.')
            // Should probably wait some time before trying to connect again.
            connectAndListen();
        });

        connection.on('message', message => {
            if (message?.utf8Data.includes("connection_opened")){
                // Wait until connection is opened to send request.
                connection.send(JSON.stringify({"type":"listen_start","device_id":`${process.env.DEVICE_ID}`,"id":`${crypto.randomBytes(6).toString('hex')}`}))
            }
            if (message.type === 'utf8') {
                if (message.utf8Data.includes("obs")){
                    weatherDB.run("INSERT INTO unparsed_observation_data(data) VALUES (?)", message.utf8Data)
                }

            }
        });
    })
    client.connect(`wss://ws.weatherflow.com/swd/data?token=${process.env.ACCESS_TOKEN}`)
}

connectAndListen();

process.on('beforeExit', code => {
    console.log(`Program exiting with ${code}`);
    process.exit(code);
})

process.on('exit', code => {
    weatherDB.close();
    console.log('Program exited.')
})

process.on('SIGINT', sig => {
    console.log('Interupt received')
    process.exit(0);
})

process.on('uncaughtException', e => {
    console.log(`Serious issue has occurred: ${e.message}`);
    process.exit(1);
})