import express from "express";
import { createSimulation, getOpenSimulations } from "../db/database.js";
import db from "../db/database.js";

const router = express.Router();

router.post("/create", (req, res) => {
  try {
    const { alertId, entryPrice, entryAmount } = req.body;
    const result = createSimulation(alertId, entryPrice, entryAmount);
    res.json({ success: true, simulationId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/open", (req, res) => {
  try {
    const simulations = getOpenSimulations();
    res.json({ success: true, data: simulations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id/close", (req, res) => {
  try {
    const { exitPrice, exitAmount } = req.body;
    const pnl = exitAmount - exitPrice * exitAmount;

    const stmt = db.prepare(`
      UPDATE simulations
      SET exit_price = ?, exit_amount = ?, status = 'closed',
          pnl = ?, closed_at = strftime('%s', 'now')
      WHERE id = ?
    `);

    stmt.run(exitPrice, exitAmount, pnl, req.params.id);
    res.json({ success: true, pnl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/stats", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        SUM(CASE WHEN status = 'closed' THEN pnl ELSE 0 END) as total_pnl,
        AVG(CASE WHEN status = 'closed' THEN pnl ELSE NULL END) as avg_pnl
      FROM simulations
    `);

    const stats = stmt.get();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
