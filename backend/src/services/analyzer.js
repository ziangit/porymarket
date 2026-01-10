export function analyzeWallet({ walletAddress, trade, walletStats }) {
  const now = Math.floor(Date.now() / 1000);
  const walletAge = walletStats.first_trade ? now - walletStats.first_trade : 0;
  const tradeSize = parseFloat(trade.size || 0);
  const totalMarkets = walletStats.total_markets || 0;

  // Calculate time from wallet creation to trade (wc/tx ratio)
  const wcTxRatio =
    walletAge > 0 ? (now - walletStats.first_trade) / walletAge : 0;

  // Scoring criteria
  let score = 0;
  const criteria = {};

  // Fresh wallet (< 1 day old)
  criteria.freshWallet = walletAge < 86400;
  if (criteria.freshWallet) score += 30;

  // Low market count (< 3 markets)
  criteria.lowMarketCount = totalMarkets < 3;
  if (criteria.lowMarketCount) score += 25;

  // Significant size (relative scoring)
  criteria.significantSize = tradeSize > 1000;
  if (tradeSize > 10000) score += 25;
  else if (tradeSize > 5000) score += 15;
  else if (tradeSize > 1000) score += 5;

  // Quick action after wallet creation
  criteria.quickAction = wcTxRatio < 0.2 && walletAge > 0;
  if (criteria.quickAction) score += 20;

  const radarScore = Math.min(score, 100);

  // Determine if this is a potential insider
  const isInsider =
    criteria.freshWallet &&
    criteria.lowMarketCount &&
    radarScore >= (process.env.MIN_RADAR_SCORE || 50);

  return {
    isInsider,
    radarScore,
    walletAge,
    wcTxRatio,
    criteria,
    totalMarkets,
  };
}
