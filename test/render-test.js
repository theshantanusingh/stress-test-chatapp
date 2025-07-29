const WebSocket = require('ws');
const cliProgress = require('cli-progress');
const os = require('os');

const SERVER_URL = 'wss://your-render-app.onrender.com'; // replace this
const CLIENT_COUNT = 2000;
const MESSAGE_INTERVAL = 50;
const MESSAGE_SIZE = 10 * 1024; // 10 KB
const RUN_DURATION_MINUTES = 180; // 3 hours

const TEST_END_TIME = Date.now() + RUN_DURATION_MINUTES * 60 * 1000;
const MESSAGE = 'x'.repeat(MESSAGE_SIZE);

let sentMessages = 0;
let connected = 0;

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(CLIENT_COUNT, 0);

const clients = [];

function createClient(i) {
  const ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    connected++;
    bar.update(connected);

    const interval = setInterval(() => {
      if (Date.now() >= TEST_END_TIME) {
        clearInterval(interval);
        ws.close();
        return;
      }
      try {
        ws.send(MESSAGE);
        sentMessages++;
      } catch (e) {}
    }, MESSAGE_INTERVAL);
  });

  ws.on('error', () => {
    // Ignore connection errors during mass test
  });

  ws.on('close', () => {
    // Optionally track closed connections
  });

  clients.push(ws);
}

for (let i = 0; i < CLIENT_COUNT; i++) {
  setTimeout(() => createClient(i), i * 2); // spread out
}

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  clients.forEach(ws => ws.close());
  showFinalStats();
  process.exit();
});

function showFinalStats() {
  const mbSent = (sentMessages * MESSAGE_SIZE) / (1024 * 1024);
  console.log(`\nTest completed:
- Connected clients: ${connected}
- Total messages sent: ${sentMessages}
- Total data sent: ${mbSent.toFixed(2)} MB (${(mbSent / 1024).toFixed(2)} GB)
`);
}

setInterval(() => {
  const used = process.memoryUsage();
  const rss = (used.rss / 1024 / 1024).toFixed(2);
  const heap = (used.heapUsed / 1024 / 1024).toFixed(2);
  const mbSent = (sentMessages * MESSAGE_SIZE) / (1024 * 1024);
  console.clear();
  console.log(`🧠 Memory: RSS ${rss} MB | Heap ${heap} MB`);
  console.log(`📤 Sent: ${mbSent.toFixed(2)} MB | ${sentMessages} msgs`);
  console.log(`🧪 Clients: ${connected}/${CLIENT_COUNT}`);
}, 5000);