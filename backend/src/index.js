import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { initDatabase } from "./db/database.js";
import { startMonitoring } from "./services/monitor.js";
import alertRoutes from "./routes/alerts.js";
import marketRoutes from "./routes/markets.js";
import simulationRoutes from "./routes/simulation.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use("/api/alerts", alertRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/simulation", simulationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start monitoring service
startMonitoring();

// Schedule periodic checks every 5 minutes
cron.schedule("*/5 * * * *", () => {
  console.log("Running scheduled market check...");
  startMonitoring();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Monitoring Polymarket for insider trades...`);
});
