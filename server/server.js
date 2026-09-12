require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const lakesRouter = require("./routes/lakes");
const simulateRouter = require("./routes/simulate");
const optimizeRouter = require("./routes/optimize");
const assistantRouter = require("./routes/assistant");
const regionalRouter = require("./routes/regional");
const alertsRouter = require("./routes/alerts");

const { startLiveAlerts } = require("./services/liveAlerts");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.set("io", io); // so controllers can emit live alerts via req.app.get("io")

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "AQUAGUARD AI" }));

app.use("/api/lakes", lakesRouter);
app.use("/api/simulate", simulateRouter);
app.use("/api/optimize", optimizeRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/regional", regionalRouter);
app.use("/api/alerts", alertsRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

io.on("connection", (socket) => {
  console.log(`[AQUAGUARD] Live client connected (${socket.id})`);
  socket.on("disconnect", () => console.log(`[AQUAGUARD] Live client disconnected (${socket.id})`));
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\n🌊 AQUAGUARD AI server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Live alert feed: ws://localhost:${PORT} (Socket.IO)\n`);
  });
  startLiveAlerts(io);
});
