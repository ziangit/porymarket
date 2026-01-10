import React from "react";
import "./Stats.css";

function Stats({ stats, alertCount }) {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <h3>Alerts (24h)</h3>
        <p className="stat-value">{alertCount}</p>
      </div>
      <div className="stat-card">
        <h3>Total Simulations</h3>
        <p className="stat-value">{stats?.total || 0}</p>
      </div>
      <div className="stat-card">
        <h3>Open Positions</h3>
        <p className="stat-value">{stats?.open || 0}</p>
      </div>
      <div className="stat-card">
        <h3>Total P&L</h3>
        <p
          className="stat-value"
          style={{
            color: (stats?.total_pnl || 0) >= 0 ? "#44ff44" : "#ff4444",
          }}
        >
          ${stats?.total_pnl?.toFixed(2) || "0.00"}
        </p>
      </div>
    </div>
  );
}

export default Stats;
