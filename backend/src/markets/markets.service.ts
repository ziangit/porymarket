import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);
  private readonly gammaApi: string;
  private readonly clobApi: string;

  constructor(private configService: ConfigService) {
    this.gammaApi = this.configService.get<string>("GAMMA_API_URL");
    this.clobApi = "https://clob.polymarket.com";
    this.logger.log(`Gamma API URL: ${this.gammaApi}`);
    this.logger.log(`CLOB API URL: ${this.clobApi}`);
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

      const url = `${this.gammaApi}/events`;
      this.logger.log(`Fetching active events: ${url}`);

      const eventsResponse = await axios.get(url, {
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
          let tokenIds = market.clobTokenIds || [];

          if (typeof tokenIds === "string") {
            try {
              tokenIds = JSON.parse(tokenIds);
            } catch {
              tokenIds = [tokenIds];
            }
          } else if (!Array.isArray(tokenIds)) {
            tokenIds = Object.values(tokenIds);
          }

          this.logger.log(`   Market: ${market.question?.substring(0, 40)}...`);

          for (const tokenId of tokenIds) {
            if (!tokenId) continue;

            try {
              this.logger.log(`      Fetching trades for token ${tokenId}...`);

              // Try without authentication first
              const tradesResponse = await axios.get(`${this.clobApi}/trades`, {
                params: { token_id: tokenId, limit: 10 },
                headers: {
                  Accept: "application/json",
                },
                timeout: 5000,
              });

              const trades = tradesResponse.data || [];
              this.logger.log(`      ✅ ${trades.length} trades`);

              if (trades.length > 0) {
                allTrades.push(
                  ...trades.map((trade) => ({
                    ...trade,
                    tokenId,
                    marketQuestion: market.question,
                    eventTitle: event.title,
                    outcomes: market.outcomes,
                    marketSlug: market.slug,
                  }))
                );
              }
            } catch (err) {
              if (err.response?.status === 401) {
                this.logger.warn(
                  `      ⚠️ Token ${tokenId}: Auth required, skipping`
                );
              } else {
                this.logger.error(`      ❌ Token ${tokenId}: ${err.message}`);
              }

              // Fallback: create mock trade data from market info for display
              const mockTrade = {
                tokenId,
                marketQuestion: market.question,
                eventTitle: event.title,
                outcomes: market.outcomes,
                marketSlug: market.slug,
                price: market.outcomePrices?.[0] || 0,
                timestamp: Date.now() / 1000,
                isMock: true,
              };
              allTrades.push(mockTrade);
            }
          }
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
    const response = await axios.get(`${this.gammaApi}/markets/${id}/trades`, {
      params: { limit },
    });
    return response.data;
  }
}
