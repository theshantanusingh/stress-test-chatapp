// test/test-clients.js
const WebSocket = require('ws');
const fs = require('fs');
const cliProgress = require('cli-progress');

const TOTAL_CLIENTS = 100;
const clients = [];
let connected = 0, matched = 0, messagesSent = 0;

const CSV_FILE = './test/results.csv';
fs.writeFileSync(CSV_FILE, 'timestamp,connected,matched,messagesSent\n');

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(TOTAL_CLIENTS, 0);

function logCSV() {
  const line = `${Date.now()},${connected},${matched},${messagesSent}\n`;
  fs.appendFileSync(CSV_FILE, line);
}

function createClient(index) {
  const ws = new WebSocket('ws://localhost:3000');
  let isMatched = false;

  ws.on('open', () => {
    connected++;
    progressBar.update(connected);
    logCSV();
  });

  ws.on('message', msg => {
    const data = JSON.parse(msg);
    if (data.type === 'info' && data.msg.includes('connected to a stranger')) {
      matched++;
      logCSV();
      if (!isMatched) {
        isMatched = true;
        // Simulate chatting
        setInterval(() => {
          ws.send(`Hello from client ${index}`);
          messagesSent++;
          logCSV();
        }, 1000);
      }
    }
  });

  ws.on('close', () => {
    logCSV();
  });

  clients.push(ws);
}

// Launch clients
for (let i = 0; i < TOTAL_CLIENTS; i++) {
  setTimeout(() => createClient(i), i * 50); // staggered to avoid overload
}

// Log summary after 60 seconds
setTimeout(() => {
  progressBar.stop();
  console.log(`\nTest completed:
- Connected: ${connected}
- Matched: ${matched}
- Messages sent: ${messagesSent}`);
  process.exit(0);
}, 60000);
