import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class SimulationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SimulationCreateInput) {
    return this.prisma.simulation.create({ data });
  }

  async findOpen() {
    return this.prisma.simulation.findMany({
      where: { status: "open" },
      include: {
        alert: {
          select: {
            marketId: true,
            marketQuestion: true,
            outcome: true,
          },
        },
      },
    });
  }

  async close(id: number, exitPrice: number, exitAmount: number) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
    });

    const entryPrice = Number(simulation.entryPrice);
    const entryAmountNum = Number(simulation.entryAmount);
    const pnl = exitAmount - entryPrice * entryAmountNum;

    return this.prisma.simulation.update({
      where: { id },
      data: {
        exitPrice,
        exitAmount,
        status: "closed",
        pnl,
        closedAt: new Date(),
      },
    });
  }

  async getStats() {
    const [total, open, closed, aggregates] = await Promise.all([
      this.prisma.simulation.count(),
      this.prisma.simulation.count({ where: { status: "open" } }),
      this.prisma.simulation.count({ where: { status: "closed" } }),
      this.prisma.simulation.aggregate({
        where: { status: "closed" },
        _sum: { pnl: true },
        _avg: { pnl: true },
      }),
    ]);

    return {
      total,
      open,
      closed,
      total_pnl: Number(aggregates._sum.pnl) || 0,
      avg_pnl: Number(aggregates._avg.pnl) || 0,
    };
  }
}
