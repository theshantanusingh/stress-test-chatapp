// Required dependencies
// Backend: express, ws, cors, morgan, chalk
// Frontend: just HTML/CSS/JS (served statically)

// Install these first:
// npm install express ws cors morgan chalk

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

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
      ws.partner.send(JSON.stringify({ type: 'chat', msg: message.toString() }));
      logEvent('Message Relay', `Message passed to partner`);
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
  if (logs.length > 100) logs.shift(); // keep only last 100 logs

  // Use chalk if available
  if (chalk) {
    console.log(chalk.blue(`[${entry.time}]`) + ` ${event} - ${details}`);
  } else {
    console.log(`[${entry.time}] ${event} - ${details}`);
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});