import { Controller, Get, Post, Query } from "@nestjs/common";
import { AlertsService } from "./alerts.service";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts(@Query("limit") limit?: string) {
    const alerts = await this.alertsService.findRecent(
      limit ? parseInt(limit) : 50
    );
    return { success: true, data: alerts };
  }

  @Get("recent")
  async getRecentAlerts(@Query("hours") hours?: string) {
    const alerts = await this.alertsService.findByTimeWindow(
      hours ? parseInt(hours) : 24 // Changed from 5 to 24 hours
    );
    return { success: true, data: alerts, count: alerts.length };
  }

  @Get("trades/recent")
  async getRecentTrades(@Query("limit") limit?: string) {
    const trades = await this.alertsService.getRecentTrades(
      limit ? parseInt(limit) : 50
    );
    return { success: true, data: trades, count: trades.length };
  }

  @Post("test")
  async createTestAlert() {
    const testAlert = await this.alertsService.create({
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      marketId: "test-market-" + Date.now(),
      marketQuestion: "Will this be a successful test?",
      tradeSize: 15000,
      outcome: "Yes",
      price: 0.65,
      walletAge: 3600,
      totalMarkets: 2,
      radarScore: 75,
      wcTxRatio: 0.15,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    });
    return { success: true, data: testAlert };
  }

  @Get("debug")
  async debugAlerts() {
    const allAlerts = await this.alertsService.findRecent(100);
    const recentAlerts = await this.alertsService.findByTimeWindow(24);

    return {
      success: true,
      totalAlerts: allAlerts.length,
      recentAlerts: recentAlerts.length,
      sampleAlerts: allAlerts.slice(0, 3),
      timestamps: allAlerts.slice(0, 5).map((a) => ({
        id: a.id,
        timestamp: a.timestamp.toString(),
        timestampAsNumber: Number(a.timestamp),
        timestampAsDate: new Date(Number(a.timestamp) * 1000).toISOString(),
      })),
    };
  }
}
