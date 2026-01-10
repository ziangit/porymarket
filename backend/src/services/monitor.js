import axios from "axios";
import { insertAlert, insertTrade, getWalletStats } from "../db/database.js";
import { analyzeWallet } from "./analyzer.js";

const GAMMA_API =
  process.env.GAMMA_API_URL || "https://gamma-api.polymarket.com";

export async function startMonitoring() {
  try {
    console.log("🔍 Scanning for suspicious trades...");

    // Fetch recent trades from Polymarket
    const trades = await fetchRecentTrades();

    for (const trade of trades) {
      await processTrade(trade);
    }

    console.log(`✅ Processed ${trades.length} trades`);
  } catch (error) {
    console.error("❌ Monitoring error:", error.message);
  }
}

async function fetchRecentTrades() {
  try {
    // Fetch markets
    const marketsResponse = await axios.get(`${GAMMA_API}/markets`);
    const markets = marketsResponse.data;

    const allTrades = [];

    // Fetch trades for each market (limit to recent active markets)
    for (const market of markets.slice(0, 50)) {
      try {
        const tradesResponse = await axios.get(
          `${GAMMA_API}/markets/${market.id}/trades`,
          { params: { limit: 100 } }
        );

        if (tradesResponse.data && Array.isArray(tradesResponse.data)) {
          const enrichedTrades = tradesResponse.data.map((trade) => ({
            ...trade,
            marketId: market.id,
            marketQuestion: market.question,
            timestamp: trade.timestamp || Math.floor(Date.now() / 1000),
          }));
          allTrades.push(...enrichedTrades);
        }
      } catch (err) {
        // Skip markets with errors
        continue;
      }
    }

    return allTrades;
  } catch (error) {
    console.error("Error fetching trades:", error.message);
    return [];
  }
}

async function processTrade(trade) {
  try {
    const walletAddress = trade.maker_address || trade.taker_address;
    if (!walletAddress) return;

    // Store trade
    insertTrade({
      walletAddress,
      marketId: trade.marketId,
      size: parseFloat(trade.size || 0),
      price: parseFloat(trade.price || 0),
      outcome: trade.outcome || trade.asset_id,
      timestamp: trade.timestamp,
    });

    // Get wallet statistics
    const walletStats = getWalletStats(walletAddress);

    // Analyze if this could be insider trading
    const analysis = analyzeWallet({
      walletAddress,
      trade,
      walletStats,
    });

    if (analysis.isInsider) {
      console.log(`🚨 ALERT: Potential insider detected!`);
      console.log(`   Wallet: ${walletAddress.slice(0, 10)}...`);
      console.log(`   Market: ${trade.marketQuestion}`);
      console.log(`   Score: ${analysis.radarScore}%`);

      insertAlert({
        walletAddress,
        marketId: trade.marketId,
        marketQuestion: trade.marketQuestion,
        tradeSize: parseFloat(trade.size || 0),
        outcome: trade.outcome || trade.asset_id,
        price: parseFloat(trade.price || 0),
        walletAge: analysis.walletAge,
        totalMarkets: walletStats.total_markets,
        radarScore: analysis.radarScore,
        wcTxRatio: analysis.wcTxRatio,
        timestamp: trade.timestamp,
      });
    }
  } catch (error) {
    console.error("Error processing trade:", error.message);
  }
}
