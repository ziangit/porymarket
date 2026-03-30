import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { AlertsService } from "../alerts/alerts.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly gammaApi: string;
  private readonly minTradeSize: number;

  constructor(
    private alertsService: AlertsService,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.gammaApi = this.configService.get<string>("GAMMA_API_URL");
    // Used to avoid classifying tiny fills as "insider" noise.
    // Defaults to 1000 to match the repo's env example.
    this.minTradeSize = this.configService.get<number>("MIN_TRADE_SIZE") ?? 1000;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMonitoring() {
    this.logger.log("🔍 Scanning for suspicious trades...");
    await this.scanMarkets();
  }

  async scanMarkets() {
    try {
      const eventsResponse = await axios.get(`${this.gammaApi}/events`, {
        params: {
          active: true,
          closed: false,
          limit: 20,
        },
      });

      const events = eventsResponse.data || [];
      this.logger.log(`Found ${events.length} active events`);

      for (const event of events.slice(0, 10)) {
        const markets = event.markets || [];
        for (const market of markets.slice(0, 2)) {
          await this.scanMarketTrades(market, event);
        }
      }

      this.logger.log("✅ Market scan completed");
    } catch (error) {
      this.logger.error("❌ Monitoring error:", error.message);
    }
  }

  private async scanMarketTrades(market: any, event: any) {
    try {
      // Gamma's event markets include `conditionId` which maps to the Data API `market` filter.
      const conditionId: string | undefined = market?.conditionId;
      if (!conditionId) {
        this.logger.warn(
          `Skipping market scan because market.conditionId is missing (market: ${market?.slug || market?.id || market?.question || "unknown"})`
        );
        return;
      }

      let parsedOutcomes = ["Yes", "No"];
      if (market.outcomes) {
        if (typeof market.outcomes === "string") {
          try {
            parsedOutcomes = JSON.parse(market.outcomes);
          } catch (e) {
            this.logger.warn(`Failed to parse outcomes: ${market.outcomes}`);
          }
        } else if (Array.isArray(market.outcomes)) {
          parsedOutcomes = market.outcomes;
        }
      }

      const response = await axios.get(`https://data-api.polymarket.com/trades`, {
        params: {
          limit: 50,
          // Data API expects `market` = conditionId(s)
          market: [conditionId],
          takerOnly: true,
        },
        timeout: 10000,
      });

      const trades = response.data || [];
      this.logger.log(
        `Got ${trades.length} trades for market: ${market.question?.substring(0, 40)}...`
      );

      for (const trade of trades) {
        await this.analyzeTrade(trade, market, event, parsedOutcomes);
      }
    } catch (error) {
      this.logger.error(`Error scanning market: ${error.message}`);
    }
  }

  private async analyzeTrade(
    trade: any,
    market: any,
    event: any,
    parsedOutcomes?: string[]
  ) {
    // CLOB trades: maker_address/taker_address
    // Data API trades: proxyWallet
    const walletAddress =
      trade.proxyWallet || trade.maker_address || trade.taker_address;
    if (!walletAddress) return;

    let outcomes = parsedOutcomes || ["Yes", "No"];
    // Data API returns human-readable outcome (e.g. "Up"/"Down" or "Yes"/"No")
    // CLOB may have a different shape, so we keep a fallback.
    const outcomeValue = trade.outcome || outcomes[0] || "Yes";

    const marketId =
      trade.conditionId ||
      market.conditionId ||
      market.id ||
      market.slug;

    await this.prisma.trade
      .create({
        data: {
          walletAddress,
          marketId,
          size: parseFloat(trade.size || 0),
          price: trade.price !== undefined && trade.price !== null ? parseFloat(trade.price) : null,
          outcome: outcomeValue,
          timestamp: BigInt(trade.timestamp || Math.floor(Date.now() / 1000)),
        },
      })
      .catch((err) => {
        if (!err.message.includes("Unique constraint")) {
          this.logger.error(`Failed to store trade: ${err.message}`);
        }
      });

    const walletStats = await this.getWalletStats(walletAddress);
    const analysis = this.analyzeWallet(trade, walletStats);

    if (analysis.isInsider) {
      this.logger.log(`🚨 ALERT: Potential insider detected!`);
      this.logger.log(`   Wallet: ${walletAddress.slice(0, 10)}...`);
      this.logger.log(`   Market: ${market.question}`);
      this.logger.log(`   Score: ${analysis.radarScore}%`);

      await this.alertsService.create({
        walletAddress,
        marketId,
        marketQuestion: market.question || event.title,
        tradeSize: parseFloat(trade.size || 0),
        outcome: outcomeValue,
        price:
          trade.price !== undefined && trade.price !== null
            ? parseFloat(trade.price)
            : null,
        walletAge: analysis.walletAge,
        totalMarkets: walletStats.totalMarkets,
        radarScore: analysis.radarScore,
        wcTxRatio: analysis.wcTxRatio,
        timestamp: BigInt(trade.timestamp || Math.floor(Date.now() / 1000)),
      });

      this.logger.log("✅ Alert created and saved to database");
    }
  }

  private async getWalletStats(walletAddress: string) {
    const trades = await this.prisma.trade.findMany({
      where: { walletAddress },
      orderBy: { timestamp: "asc" },
    });

    const uniqueMarkets = new Set(trades.map((t) => t.marketId));

    return {
      totalMarkets: uniqueMarkets.size,
      totalTrades: trades.length,
      firstTrade: trades.length > 0 ? Number(trades[0].timestamp) : null,
    };
  }

  private analyzeWallet(trade: any, walletStats: any) {
    const now = Math.floor(Date.now() / 1000);
    const walletAge = walletStats.firstTrade ? now - walletStats.firstTrade : 0;
    const tradeSize = parseFloat(trade.size || 0);
    const totalMarkets = walletStats.totalMarkets || 0;

    const wcTxRatio =
      walletAge > 0 ? (now - walletStats.firstTrade) / walletAge : 0;

    let score = 0;

    if (walletAge < 86400) score += 30;
    if (totalMarkets < 3) score += 25;
    if (tradeSize > 10000) score += 25;
    else if (tradeSize > 5000) score += 15;
    else if (tradeSize > 1000) score += 5;
    if (wcTxRatio < 0.2 && walletAge > 0) score += 20;

    const radarScore = Math.min(score, 100);
    // Require minimum trade size to qualify as an insider.
    // This prevents tiny $1 fills from being treated as signals.
    const isInsider =
      tradeSize > this.minTradeSize &&
      walletAge < 86400 &&
      totalMarkets < 3 &&
      radarScore >= 50;

    return {
      isInsider,
      radarScore,
      walletAge,
      wcTxRatio,
      totalMarkets,
    };
  }
}
