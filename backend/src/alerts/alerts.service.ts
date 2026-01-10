import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.AlertCreateInput) {
    return this.prisma.alert.create({ data });
  }

  async findRecent(limit: number = 50) {
    const alerts = await this.prisma.alert.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Convert BigInt to string for JSON serialization
    return alerts.map((alert) => ({
      ...alert,
      timestamp: alert.timestamp.toString(),
    }));
  }

  async findByTimeWindow(hours: number = 5) {
    const cutoff = BigInt(Math.floor(Date.now() / 1000) - hours * 3600);
    const alerts = await this.prisma.alert.findMany({
      where: {
        timestamp: {
          gt: cutoff,
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    return alerts.map((alert) => ({
      ...alert,
      timestamp: alert.timestamp.toString(),
    }));
  }

  async countRecent(hours: number = 24) {
    const cutoff = BigInt(Math.floor(Date.now() / 1000) - hours * 3600);
    return this.prisma.alert.count({
      where: {
        timestamp: {
          gt: cutoff,
        },
      },
    });
  }

  async getLatestTrades(limit: number = 50) {
    return this.prisma.trade.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        id: true,
        walletAddress: true,
        marketId: true,
        size: true,
        price: true,
        outcome: true,
        timestamp: true,
        createdAt: true,
      },
    });
  }

  async getRecentTrades(limit: number = 50) {
    return this.prisma.trade.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
