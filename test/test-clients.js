// test/test-clients.js
const WebSocket = require('ws');
const cliProgress = require('cli-progress');

const TOTAL_CLIENTS = 3000;
const MESSAGE_INTERVAL = 100; // in ms
const TEST_DURATION = 7 * 60 * 1000; // 7 minutes

const clients = [];
let connected = 0, matched = 0, messagesSent = 0;

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(TOTAL_CLIENTS, 0);

// Create a large dummy message ~500 bytes
const MESSAGE = 'x'.repeat(500);

function createClient(index) {
  const ws = new WebSocket('ws://localhost:3000');
  let isMatched = false;
  let interval;

  ws.on('open', () => {
    connected++;
    progressBar.update(connected);
  });

  ws.on('message', msg => {
    const data = JSON.parse(msg);
    if (data.type === 'info' && data.msg.includes('connected to a stranger')) {
      matched++;
      if (!isMatched) {
        isMatched = true;
        interval = setInterval(() => {
          try {
            ws.send(`${index}: ${MESSAGE}`);
            messagesSent++;
          } catch (e) {}
        }, MESSAGE_INTERVAL);
      }
    }
  });

  ws.on('close', () => {
    clearInterval(interval);
  });

  clients.push(ws);
}

// Launch clients staggered to avoid crashing
for (let i = 0; i < TOTAL_CLIENTS; i++) {
  setTimeout(() => createClient(i), i * 5); // stagger rate = 5ms per client
}

// Stop test after TEST_DURATION
setTimeout(() => {
  progressBar.stop();
  console.log(`\nTest completed:
- Connected: ${connected}
- Matched: ${matched}
- Messages sent: ${messagesSent}`);
  clients.forEach(ws => ws.close());
  process.exit(0);
}, TEST_DURATION);
