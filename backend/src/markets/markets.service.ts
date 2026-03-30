import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);
  private readonly gammaApi: string;
  private readonly clobApi: string;
  private readonly dataApi: string;

  constructor(private configService: ConfigService) {
    this.gammaApi = this.configService.get<string>("GAMMA_API_URL");
    this.clobApi = "https://clob.polymarket.com";
    this.dataApi = "https://data-api.polymarket.com";
    this.logger.log(`Gamma API URL: ${this.gammaApi}`);
    this.logger.log(`CLOB API URL: ${this.clobApi}`);
    this.logger.log(`Data API URL: ${this.dataApi}`);
  }

  async getMarkets(limit: number = 100) {
    const response = await axios.get(`${this.gammaApi}/markets`, {
      params: { limit },
    });
    return response.data;
  }

  async getMarket(id: string) {
    const response = await axios.get(`${this.gammaApi}/markets/${id}`);
    return response.data;
  }

  async getRecentTrades(limit: number = 100) {
    try {
      this.logger.log("=== Starting getRecentTrades ===");

      const eventsResponse = await axios.get(`${this.gammaApi}/events`, {
        params: {
          active: true,
          closed: false,
          limit: 20,
        },
      });

      const events = eventsResponse.data || [];
      this.logger.log(`✅ Found ${events.length} active events`);

      if (events.length === 0) return [];

      const allTrades = [];

      for (let i = 0; i < Math.min(10, events.length); i++) {
        const event = events[i];
        const markets = event.markets || [];
        this.logger.log(
          `\n📊 Event ${i + 1}: ${event.title?.substring(0, 50)}...`
        );
        this.logger.log(`   Markets: ${markets.length}`);

        for (const market of markets.slice(0, 2)) {
          const conditionId: string | undefined = market?.conditionId;
          if (!conditionId) continue;

          this.logger.log(`   Market: ${market.question?.substring(0, 40)}...`);

          const tradesResponse = await axios.get(`${this.dataApi}/trades`, {
            params: {
              limit: 10,
              market: [conditionId],
              takerOnly: true,
            },
            timeout: 10000,
          });

          const trades = tradesResponse.data || [];
          this.logger.log(`      ✅ ${trades.length} trades`);

          allTrades.push(
            ...trades.map((trade) => ({
              ...trade,
              // Keep some names expected by older UI code.
              maker_address: trade.proxyWallet,
              taker_address: trade.proxyWallet,
              tokenId: trade.asset,
              marketQuestion: market.question,
              eventTitle: event.title,
              outcomes: market.outcomes,
              marketSlug: market.slug,
            }))
          );
        }
      }

      this.logger.log(
        `\n📦 Total: ${allTrades.length} items (including market data)`
      );
      this.logger.log("=== End getRecentTrades ===\n");

      return allTrades
        .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
        .slice(0, limit);
    } catch (error) {
      this.logger.error("❌ Error:", error.message);
      this.logger.error("Stack:", error.stack);
      return [];
    }
  }

  async getMarketTrades(id: string, limit: number = 100) {
    // Data API `market` expects Gamma's `conditionId` (0x...64 hex).
    const isConditionId = /^0x[a-fA-F0-9]{64}$/.test(id);

    let conditionId: string | undefined = id;
    if (!isConditionId) {
      const market = await axios.get(`${this.gammaApi}/markets/${id}`);
      conditionId = market.data?.conditionId;
    }

    if (!conditionId) return [];

    const response = await axios.get(`${this.dataApi}/trades`, {
      params: {
        limit,
        market: [conditionId],
        takerOnly: true,
      },
    });
    return response.data;
  }
}
