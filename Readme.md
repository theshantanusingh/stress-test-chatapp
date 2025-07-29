# 🔥 Stress-Tested WebSocket Chat Server (AI HELPED MOSTLY)

A high-performance WebSocket-based chat server designed to test real-time communication at massive scale.

This project is not just a basic chat backend — it’s a battle-tested, performance-logging, realistic-load-simulating chat system built for pushing servers to their limit. Whether you're learning system design or benchmarking a production-grade deployment, this project is engineered to give you deep insight into how your system behaves under load.

---

## 🚀 Project Goals

- ✅ Build a minimal but real-time chat application over WebSocket  
- ✅ Create realistic matchmaking and chat flows  
- ✅ Log all connection and messaging events persistently to disk  
- ✅ Track bandwidth, memory, and CPU usage over time  
- ✅ Simulate thousands of concurrent users  
- ✅ Provide human-readable performance reports and graphs  
- ✅ Test and analyze on both local machine and cloud servers (e.g., Render)

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express.js, WebSocket (`ws`)
- **Logging**: File-based persistent JSONL logs (`logs/chat-logs.jsonl`)
- **Monitoring**: `/report` page showing historical load stats
- **Client Load Testing**: Custom test script simulating hundreds–thousands of clients

---

## 🧪 Test Philosophy

Real-world chat isn't just 1 message per second. It's typing, idling, large payloads, bursts, and disconnects.

This test system is **evil 😈**:

- Simulates multi-minute chats  
- Sends long messages  
- Generates massive bandwidth and memory use  
- Tests scalability of connection handling, message relay, and matchmaking  

---

## 📊 Performance Report

Accessible at: http://localhost:3000/report



Tracks:

- Total connections  
- Total matches  
- Messages relayed  
- Disconnects  
- Bandwidth (approximate)  
- Memory usage  
- CPU cores used  
- Uptime  

✅ Logs are persisted across restarts  
✅ Data is read entirely from disk logs  
✅ No in-memory reset = true historical reporting

---

## 📂 Project Structure

├── public/ # Chat frontend (HTML/CSS/JS)
├── test/ # Load testing clients
│ └── test-clients.js
├── logs/ # All chat logs (.jsonl) + bandwidth
│ └── chat-logs.jsonl
│ └── bandwidth.jsonl
├── server.js # WebSocket + Express backend
└── README.md # You're here



---

## 🧪 Run Locally

```bash
npm install
node server.js


