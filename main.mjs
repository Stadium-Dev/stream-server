import NodeMediaServer from 'node-media-server';
import express from 'express';
import express_ws from 'express-ws';

const config = {
    rtmp: {
        port: 1935,
        chunk_size: 10000,
        gop_cache: true,
        ping: 15,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*'
    }
};

var nms = new NodeMediaServer(config)
nms.run();

// socket server for coms
const app = express();
const expressWs = express_ws(app);

const connections = [];

function broadcast(msg) {
    for(let conn of connections) {
        conn.send(JSON.stringify(msg));
    }
}

app.ws('/', function (ws, req) {
    connections.push(ws);
    // new connection?
    ws.on('message', function (msg) {
        console.log(msg);
    });
    ws.on('error', function (msg) {
        disconnect();
    });
    ws.on('disconnect', function (msg) {
        disconnect();
    });

    function disconnect() {
        connections.splice(connections.indexOf(ws), 1);
    }

    console.log('service connections: ' + connections.length);
});

const SERVIVE_PORT = 3008;
console.log('Service Websocket starte on ' + SERVIVE_PORT);
app.listen(SERVIVE_PORT);

nms.on('postPublish', (id, StreamPath, args) => {
    handleStreamConnect(StreamPath);
});

nms.on('donePublish', (id, StreamPath, args) => {
    handleStreamDisconnect(StreamPath);
});

function handleStreamDisconnect() {
    broadcast({ type: "stream-disconnected", ts: Date.now() });
}

function handleStreamConnect() {
    broadcast({ type: "stream-connected", ts: Date.now() });
}