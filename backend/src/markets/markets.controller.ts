import { Controller, Get, Param, Query } from "@nestjs/common";
import { MarketsService } from "./markets.service";

@Controller("markets")
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  async getMarkets(@Query("limit") limit?: string) {
    const data = await this.marketsService.getMarkets(
      limit ? parseInt(limit) : 100
    );
    return { success: true, data };
  }

  // Put specific routes BEFORE parameterized routes
  @Get("trades/recent")
  async getRecentTrades(@Query("limit") limit?: string) {
    const data = await this.marketsService.getRecentTrades(
      limit ? parseInt(limit) : 100
    );
    return { success: true, data };
  }

  @Get(":id")
  async getMarket(@Param("id") id: string) {
    const data = await this.marketsService.getMarket(id);
    return { success: true, data };
  }

  @Get(":id/trades")
  async getMarketTrades(
    @Param("id") id: string,
    @Query("limit") limit?: string
  ) {
    const data = await this.marketsService.getMarketTrades(
      id,
      limit ? parseInt(limit) : 100
    );
    return { success: true, data };
  }
}
