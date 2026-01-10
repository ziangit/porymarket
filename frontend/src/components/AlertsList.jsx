import React from "react";
import "./AlertsList.css";

function AlertsList({ alerts }) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="alerts-container">
      <h2>🚨 Recent Alerts (Last 24h)</h2>
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <p className="no-alerts">No insider alerts detected yet</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div className="alert-header">
                <span
                  className="radar-score"
                  style={{
                    backgroundColor:
                      alert.radar_score >= 80
                        ? "#ff4444"
                        : alert.radar_score >= 60
                        ? "#ffaa00"
                        : "#44ff44",
                  }}
                >
                  Score: {alert.radar_score}%
                </span>
                <span className="timestamp">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>

              <div className="alert-body">
                <h3>{alert.market_question}</h3>
                <div className="alert-details">
                  <div className="detail-row">
                    <span className="label">Wallet:</span>
                    <span className="value">
                      {formatAddress(alert.wallet_address)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Trade Size:</span>
                    <span className="value">
                      ${alert.trade_size.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span className="value">
                      ${alert.price?.toFixed(4) || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Wallet Age:</span>
                    <span className="value">
                      {(alert.wallet_age / 3600).toFixed(1)}h
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total Markets:</span>
                    <span className="value">{alert.total_markets}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertsList;
