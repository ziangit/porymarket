import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import InsiderTable from "./components/InsiderTable";
import FilterBar from "./components/FilterBar";
import Stats from "./components/Stats";

const API_URL = "/api";

function App() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [filters, setFilters] = useState({
    hideClosedMarkets: true,
    hideSoldPositions: false,
    minSize: 1000,
    minRadarScore: 50,
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      console.log("Fetching alerts and stats...");

      const [alertsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/alerts/recent?hours=24`),
        axios.get(`${API_URL}/simulation/stats`),
      ]);

      console.log("Alerts response:", alertsRes.data);
      console.log("Stats response:", statsRes.data);

      setAlerts(alertsRes.data.data || []);
      setStats(statsRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", error.response?.data);
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filters.minSize && Number(alert.tradeSize) < filters.minSize) return false;
    if (filters.minRadarScore && Number(alert.radarScore) < filters.minRadarScore) return false;

    if (strictMode) {
      const now = Date.now() / 1000;
      const timeSinceTrade = now - Number(alert.timestamp);
      if (Number(alert.walletAge) >= 86400) return false;       // wallet age under 1 day
      if (Number(alert.totalMarkets) >= 3) return false;        // less than 3 markets
      if (Number(alert.tradeSize) <= 1000) return false;        // size over $1k
      if (Number(alert.radarScore) < 50) return false;          // radar score above 50%
      if (Number(alert.wcTxRatio) >= 0.2) return false;         // wc/tx under 20%
      if (timeSinceTrade >= 18000) return false;                 // within last 5 hours
    }

    return true;
  });

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🎯 Polymarket Insider Hunter</h1>
            <span className="beta-badge">Beta</span>
          </div>
          <p className="subtitle">
            Insiders typically don't leave a large paper trail. Use this tool to
            track significant trades from rookie wallets.
          </p>
          <button
            className={`strict-mode-btn ${strictMode ? "active" : ""}`}
            onClick={() => setStrictMode((v) => !v)}
          >
            {strictMode ? "🔒 Strict Mode" : "🔓 Loose Mode"}
          </button>
        </div>
      </header>

      <main className="App-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <Stats stats={stats} alertCount={filteredAlerts.length} />
            <FilterBar filters={filters} setFilters={setFilters} />
            <InsiderTable alerts={filteredAlerts} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
