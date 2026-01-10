import express from "express";
import { getRecentAlerts, getAlertsByTimeWindow } from "../db/database.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const alerts = getRecentAlerts(limit);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/recent", (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 5;
    const alerts = getAlertsByTimeWindow(hours);
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
