import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "../../data/polymarket.db"));

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      market_id TEXT NOT NULL,
      market_question TEXT,
      trade_size REAL NOT NULL,
      outcome TEXT,
      price REAL,
      wallet_age INTEGER,
      total_markets INTEGER,
      radar_score REAL,
      wc_tx_ratio REAL,
      timestamp INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      end_date INTEGER,
      volume REAL,
      liquidity REAL,
      outcomes TEXT,
      last_updated INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      market_id TEXT NOT NULL,
      size REAL NOT NULL,
      price REAL,
      outcome TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS simulations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      entry_price REAL NOT NULL,
      entry_amount REAL NOT NULL,
      exit_price REAL,
      exit_amount REAL,
      status TEXT DEFAULT 'open',
      pnl REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      closed_at INTEGER,
      FOREIGN KEY (alert_id) REFERENCES alerts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_wallet ON alerts(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market_id);
  `);

  console.log("✅ Database initialized");
}

export function insertAlert(alert) {
  const stmt = db.prepare(`
    INSERT INTO alerts (
      wallet_address, market_id, market_question, trade_size,
      outcome, price, wallet_age, total_markets, radar_score,
      wc_tx_ratio, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    alert.walletAddress,
    alert.marketId,
    alert.marketQuestion,
    alert.tradeSize,
    alert.outcome,
    alert.price,
    alert.walletAge,
    alert.totalMarkets,
    alert.radarScore,
    alert.wcTxRatio,
    alert.timestamp
  );
}

export function getRecentAlerts(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM alerts
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getAlertsByTimeWindow(hours = 5) {
  const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
  const stmt = db.prepare(`
    SELECT * FROM alerts
    WHERE timestamp > ?
    ORDER BY timestamp DESC
  `);
  return stmt.all(cutoff);
}

export function insertTrade(trade) {
  const stmt = db.prepare(`
    INSERT INTO trades (wallet_address, market_id, size, price, outcome, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    trade.walletAddress,
    trade.marketId,
    trade.size,
    trade.price,
    trade.outcome,
    trade.timestamp
  );
}

export function getWalletStats(walletAddress) {
  const stmt = db.prepare(`
    SELECT 
      COUNT(DISTINCT market_id) as total_markets,
      COUNT(*) as total_trades,
      SUM(size) as total_volume,
      MIN(timestamp) as first_trade
    FROM trades
    WHERE wallet_address = ?
  `);
  return stmt.get(walletAddress);
}

export function createSimulation(alertId, entryPrice, entryAmount) {
  const stmt = db.prepare(`
    INSERT INTO simulations (alert_id, entry_price, entry_amount)
    VALUES (?, ?, ?)
  `);
  return stmt.run(alertId, entryPrice, entryAmount);
}

export function getOpenSimulations() {
  const stmt = db.prepare(`
    SELECT s.*, a.market_id, a.market_question, a.outcome
    FROM simulations s
    JOIN alerts a ON s.alert_id = a.id
    WHERE s.status = 'open'
  `);
  return stmt.all();
}

export default db;
