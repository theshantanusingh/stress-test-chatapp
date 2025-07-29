const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const os = require('os');
const fs = require('fs');

let chalk;
import('chalk').then(m => chalk = m.default);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

const LOG_FILE = path.join(__dirname, 'logs/chat-logs.jsonl');
const BANDWIDTH_FILE = path.join(__dirname, 'logs/bandwidth.log');

let queue = [];
let logs = [];
let serverStartTime = Date.now();
let bytesSent = readBytesSentFromFile();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Serve UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Report page
app.get('/report', (req, res) => {
  const logLines = readLogs();
  let totalConnections = 0;
  let totalMatches = 0;
  let totalMessages = 0;
  let totalDisconnects = 0;

  for (const entry of logLines) {
    switch (entry.event) {
      case 'New Connection': totalConnections++; break;
      case 'Matched': totalMatches++; break;
      case 'Message Relay': totalMessages++; break;
      case 'Disconnected': totalDisconnects++; break;
    }
  }

  const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);
  const memory = process.memoryUsage();
  const cpuCount = os.cpus().length;

  res.send(`
  <html><head><title>Chat Report</title></head><body style="font-family:sans-serif;margin:2em;">
    <h2>Back-of-the-Envelope Report (All Time)</h2>
    <ul>
      <li><strong>Total Connections:</strong> ${totalConnections}</li>
      <li><strong>Total Matches:</strong> ${totalMatches}</li>
      <li><strong>Total Messages:</strong> ${totalMessages}</li>
      <li><strong>Total Disconnects:</strong> ${totalDisconnects}</li>
      <li><strong>Uptime:</strong> ${Math.floor(uptimeSec / 60)} min ${uptimeSec % 60} sec</li>
      <li><strong>Memory Usage:</strong> ${(memory.rss / 1024 / 1024).toFixed(2)} MB</li>
      <li><strong>Heap Used:</strong> ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB</li>
      <li><strong>CPU Cores:</strong> ${cpuCount}</li>
      <li><strong>Total Bandwidth (approx):</strong> ${(bytesSent / 1024).toFixed(2)} KB</li>
    </ul>
    <p style="color:gray;">Data persists across restarts. Logs are read from file.</p>
  </body></html>
  `);
});

// View logs
app.get('/logs', (req, res) => {
  const htmlLogs = logs.map(entry => `
    <div style="margin:1em 0;padding:1em;background:#f5f5f5;border-left:4px solid #007acc">
      <div><strong>Time:</strong> ${entry.time}</div>
      <div><strong>Event:</strong> ${entry.event}</div>
      <div><strong>Details:</strong> ${entry.details}</div>
    </div>
  `).join('');

  res.send(`
    <html><head><title>Server Logs</title></head><body style="font-family:sans-serif;margin:2em;">
      <h2>Recent Server Logs</h2>
      ${htmlLogs || '<p>No logs yet.</p>'}
    </body></html>
  `);
});

// WebSocket matchmaking
wss.on('connection', function (ws) {
  ws.partner = null;
  logEvent('New Connection', 'Waiting for match');

  if (queue.length > 0) {
    const partner = queue.shift();
    partner.partner = ws;
    ws.partner = partner;
    sendBoth(partner, ws, 'You are connected to a stranger!');
    logEvent('Matched', 'Two users connected');
  } else {
    queue.push(ws);
  }

  ws.on('message', function incoming(msg) {
    if (ws.partner) {
      const size = Buffer.byteLength(msg.toString());
      bytesSent += size;
      updateBytesSentToFile(bytesSent);
      ws.partner.send(JSON.stringify({ type: 'chat', msg: msg.toString() }));
      logEvent('Message Relay', `Message size: ${size} bytes`);
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

// Utilities
function sendBoth(a, b, msg) {
  a.send(JSON.stringify({ type: 'info', msg }));
  b.send(JSON.stringify({ type: 'info', msg }));
}

function logEvent(event, details) {
  const entry = {
    time: new Date().toLocaleString(),
    event,
    details,
  };
  logs.push(entry);
  if (logs.length > 100) logs.shift();
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  if (chalk) console.log(chalk.blue(`[${entry.time}]`) + ` ${event} - ${details}`);
  else console.log(`[${entry.time}] ${event} - ${details}`);
}

function readLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    return data.trim().split('\n').map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

function readBytesSentFromFile() {
  try {
    return parseInt(fs.readFileSync(BANDWIDTH_FILE, 'utf-8'), 10) || 0;
  } catch {
    return 0;
  }
}

function updateBytesSentToFile(bytes) {
  fs.writeFileSync(BANDWIDTH_FILE, bytes.toString());
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});