// Install these first: if you have pulled the code from GitHub or got it from somewhere else
// cmd:    npm install express ws cors morgan chalk

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const os = require('os');

const { performance } = require('perf_hooks');
let bytesSent = 0;
let serverStartTime = Date.now();


const fs = require('fs');
const LOG_FILE = path.join(__dirname, 'logs/chat-logs.jsonl');


// 🔧 chalk is now ESM-only, use dynamic import
let chalk;
import('chalk').then(module => {
    chalk = module.default;
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

let queue = [];
let logs = [];

app.use(cors());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Serve chat app UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/report', (req, res) => {
    let logLines = [];
    try {
        const data = fs.readFileSync(LOG_FILE, 'utf-8');
        logLines = data.trim().split('\n').map(line => JSON.parse(line));
    } catch {
        // no logs yet
    }

    let totalConnections = 0;
    let totalMatches = 0;
    let totalMessages = 0;
    let disconnects = 0;

    logLines.forEach(entry => {
        if (entry.event === 'New Connection') totalConnections++;
        if (entry.event === 'Matched') totalMatches++;
        if (entry.event === 'Message Relay') totalMessages++;
        if (entry.event === 'Disconnected') disconnects++;
    });

    const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);
    const memory = process.memoryUsage();
    const cpuCount = os.cpus().length;

    res.send(`
  <html>
    <head><title>Chat Report</title></head>
    <body style="font-family:Arial,sans-serif;margin:2em;">
      <h2>Back-of-the-Envelope Report</h2>
      <ul>
        <li><strong>Total Connections:</strong> ${totalConnections}</li>
        <li><strong>Total Matches:</strong> ${totalMatches}</li>
        <li><strong>Total Messages:</strong> ${totalMessages}</li>
        <li><strong>Total Disconnects:</strong> ${disconnects}</li>
        <li><strong>Uptime:</strong> ${Math.floor(uptimeSec / 60)} min ${uptimeSec % 60} sec</li>
        <li><strong>Memory Usage:</strong> ${(memory.rss / 1024 / 1024).toFixed(2)} MB</li>
        <li><strong>Heap Used:</strong> ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB</li>
        <li><strong>CPU Cores:</strong> ${cpuCount}</li>
        <li><strong>Total Bandwidth (approx):</strong> ${(bytesSent / 1024).toFixed(2)} KB</li>
      </ul>
      <p style="margin-top:2em;color:#666;"><i>Note: These values are approximate and reset on each server restart.</i></p>
    </body>
  </html>
`);

});


// Serve logs in a pretty format
app.get('/logs', (req, res) => {
    const htmlLogs = logs.map(entry => `
    <div style="margin-bottom:1em;padding:1em;background:#f5f5f5;border-left:4px solid #007acc">
      <div><strong>Time:</strong> ${entry.time}</div>
      <div><strong>Event:</strong> ${entry.event}</div>
      <div><strong>Details:</strong> ${entry.details}</div>
    </div>
  `).join('');

    res.send(`
    <html>
      <head><title>Server Logs</title></head>
      <body style="font-family:Arial,sans-serif;margin:2em;">
        <h2>Server Logs</h2>
        ${htmlLogs || '<p>No logs yet.</p>'}
      </body>
    </html>
  `);
});

// WebSocket matchmaking logic
wss.on('connection', function connection(ws) {
    ws.partner = null;
    logEvent('New Connection', 'Waiting for match');

    if (queue.length > 0) {
        const partner = queue.shift();
        partner.partner = ws;
        ws.partner = partner;
        partner.send(JSON.stringify({ type: 'info', msg: 'You are connected to a stranger!' }));
        ws.send(JSON.stringify({ type: 'info', msg: 'You are connected to a stranger!' }));
        logEvent('Matched', 'Two users connected');
    } else {
        queue.push(ws);
    }

    ws.on('message', function incoming(message) {
        if (ws.partner) {
            const messageStr = message.toString();
            bytesSent += Buffer.byteLength(messageStr); // track message size
            ws.partner.send(JSON.stringify({ type: 'chat', msg: messageStr }));

        }
    });

    ws.on('close', function () {
        if (ws.partner) {
            ws.partner.send(JSON.stringify({ type: 'info', msg: 'Stranger disconnected.' }));
            ws.partner.partner = null;
        } else {
            queue = queue.filter(client => client !== ws);
        }
        logEvent('Disconnected', 'User disconnected');
    });
});

function logEvent(event, details) {
    const entry = {
        time: new Date().toLocaleString(),
        event,
        details,
    };
    logs.push(entry);
    if (logs.length > 100) logs.shift(); // Keep recent in-memory logs

    // Save to file
    fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', err => {
        if (err) console.error('Failed to write log:', err);
    });

    if (chalk) {
        console.log(chalk.blue(`[${entry.time}]`) + ` ${event} - ${details}`);
    } else {
        console.log(`[${entry.time}] ${event} - ${details}`);
    }
}


server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});