import React from "react";
import "./InsiderTable.css";

function InsiderTable({ alerts }) {
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getDisplayName = (alert) => {
    // Use wallet name if available and different from address
    if (alert.walletName && alert.walletName.trim() !== "") {
      return alert.walletName;
    }
    // Show shortened address as fallback
    return formatAddress(alert.walletAddress);
  };

  const formatTime = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - Number(timestamp);
    const hours = Math.floor(diff / 3600);
    if (hours < 1) return `${Math.floor(diff / 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const formatCurrency = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatWalletAge = (walletAge) => {
    if (!walletAge) return "-";
    const hours = Math.floor(walletAge / 3600);
    if (hours < 1) return `${Math.floor(walletAge / 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#ef4444";
    if (score >= 60) return "#f59e0b";
    return "#10b981";
  };

  const parseOutcome = (alert) => {
    // Try to parse outcomes if it's a JSON string
    let outcomes = alert.outcome;

    if (typeof alert.outcomes === "string") {
      try {
        const parsed = JSON.parse(alert.outcomes);
        // If outcomes is an array, use the alert.outcome as index or default to first
        if (Array.isArray(parsed)) {
          return alert.outcome || parsed[0] || "Yes";
        }
      } catch {
        // If parsing fails, just use the outcome field
      }
    }

    return alert.outcome || "Yes";
  };

  return (
    <div className="insider-table-container">
      <div className="table-header">
        <h2>Recent Insider Alerts</h2>
        <div className="table-controls">
          <button className="view-btn active">📊 Table View</button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <p>No insider alerts detected in the selected timeframe</p>
          <span>Try adjusting your filters or wait for the next scan</span>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="insider-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Bet</th>
                <th>Market</th>
                <th>Time</th>
                <th>Price</th>
                <th>Market Trades</th>
                <th>Wallet Age</th>
                <th>wc/tx</th>
                <th>Radar Score</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="table-row">
                  <td className="wallet-cell">
                    <a
                      href={`https://polymarket.com/profile/${alert.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatAddress(alert.walletAddress)}
                    </a>
                  </td>
                  <td className="size-cell">
                    {formatCurrency(Number(alert.tradeSize))}
                  </td>
                  <td className="bet-cell">
                    <span
                      className={`bet-badge ${
                        parseOutcome(alert) === "Yes" ? "bet-yes" : "bet-no"
                      }`}
                    >
                      {parseOutcome(alert)}
                    </span>
                    {alert.price != null && (
                      <span className="bet-prob">
                        {(() => {
                          const pct = Number(alert.price) * 100;
                          if (pct === 0) return "?%";
                          if (pct < 1) return `${pct.toFixed(2)}%`;
                          return `${pct.toFixed(0)}%`;
                        })()}
                      </span>
                    )}
                  </td>
                  <td className="market-cell">
                    <div className="market-info">
                      <span className="market-icon">🗳️</span>
                      {alert.marketSlug ? (
                        <a
                          href={`https://polymarket.com/event/${alert.marketSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="market-question market-link"
                        >
                          {alert.marketQuestion}
                        </a>
                      ) : (
                        <span className="market-question">{alert.marketQuestion}</span>
                      )}
                    </div>
                  </td>
                  <td className="time-cell">{formatTime(alert.timestamp)}</td>
                  <td className="price-cell">
                    {alert.price ? Number(alert.price).toFixed(2) : "-"}
                  </td>
                  <td className="trades-cell">{alert.totalMarkets}</td>
                  <td className="conc-cell">
                    {formatWalletAge(alert.walletAge)}
                  </td>
                  <td className="pnl-cell">
                    {alert.wcTxRatio != null
                      ? `${(Number(alert.wcTxRatio) * 100).toFixed(1)}%`
                      : "-"}
                  </td>
                  <td className="score-cell">
                    <span
                      className="score-badge"
                      style={{
                        backgroundColor: getScoreColor(
                          Number(alert.radarScore)
                        ),
                      }}
                    >
                      {Number(alert.radarScore).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InsiderTable;
