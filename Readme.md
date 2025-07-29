🔥 Stress-Tested WebSocket Chat Server (AI HELPED MOSTLY.)
A high-performance WebSocket-based chat server designed to test real-time communication at massive scale.

This project is not just a basic chat backend — it’s a battle-tested, performance-logging, realistic-load-simulating chat system built for pushing servers to their limit. Whether you're learning system design or benchmarking a production-grade deployment, this project is engineered to give you deep insight into how your system behaves under load.

🚀 Project Goals
✅ Build a minimal but real-time chat application over WebSocket

✅ Create realistic matchmaking and chat flows

✅ Log all connection and messaging events persistently to disk

✅ Track bandwidth, memory, and CPU usage over time

✅ Simulate thousands of concurrent users

✅ Provide human-readable performance reports and graphs

✅ Test and analyze on both local machine and cloud servers (e.g., Render)

🧱 Tech Stack
Backend: Node.js, Express.js, WebSocket (ws)

Logging: File-based persistent JSONL logs (logs/chat-logs.jsonl)

Monitoring: /report page showing historical load stats

Client Load Testing: Custom test script simulating 100s–1000s of clients

🧪 Test Philosophy
Real-world chat isn't 1 message per second. It's typing, idle, large payloads, bursts, and disconnects.

Our test system is evil 😈:

Simulates multi-minute chats

Sends long messages

Generates massive bandwidth and memory use

Tests scalability of connection handling, message relay, and matchmaking

📊 Performance Report
Available at:

bash
Copy
Edit
http://localhost:3000/report
Tracks:

Total connections

Total matches

Messages relayed

Disconnects

Bandwidth (approximate)

Memory usage

CPU cores used

Uptime

✅ Logs are persisted across restarts
✅ Data is read entirely from disk logs
✅ No in-memory reset means true historical reporting

📂 Project Structure
bash
Copy
Edit
.
├── public/                  # Chat frontend (HTML/CSS/JS)
├── test/                    # Load testing clients
│   └── test-clients.js
├── logs/                    # All chat logs (.jsonl) + bandwidth
│   └── chat-logs.jsonl
│   └── bandwidth.jsonl
├── server.js                # WebSocket + Express backend
└── README.md                # You're here
🧪 Run Locally
bash
Copy
Edit
npm install
node server.js
Access chat UI at http://localhost:3000
Access performance report at http://localhost:3000/report
Access live logs at http://localhost:3000/logs

🔨 Run Stress Test
Go to test/test-clients.js, configure the test parameters:

js
Copy
Edit
const TOTAL_CLIENTS = 3000;           // number of clients
const MESSAGE_LENGTH = 2000;          // message size in characters
const MESSAGES_PER_CLIENT = 30;       // how many messages per client
Then run:

bash
Copy
Edit
npm test
Tip: Use task manager or htop to monitor system usage during the test.

🧠 What You Learn From This
How a real-time chat app behaves under massive load

How CPU, memory, bandwidth usage scale with users

How to persist and report operational metrics

How to simulate realistic behavior, not just “hello” bots

📌 Notes
Stats in /report reflect real test history from disk, not just server memory

All logs are stored in .jsonl format and can be piped into analytics tools

This project is not optimized for production but is realistic enough to model a real-world workload

🧰 Future Plans
 Token rotation and secure authentication

 WebRTC-based video call support

 Redis for matchmaking queues

 Dockerize each service for deployment

 Grafana or CLI charts (CSV → visual analysis)

🧑‍💻 Author
Shantanu
Built for performance research, deep system analysis, and educational scale testing.

