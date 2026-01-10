import { Controller, Get, Post, Put, Body, Param } from "@nestjs/common";
import { SimulationsService } from "./simulations.service";

@Controller("simulation")
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post("create")
  async create(
    @Body() body: { alertId: number; entryPrice: number; entryAmount: number }
  ) {
    const simulation = await this.simulationsService.create({
      alert: { connect: { id: body.alertId } },
      entryPrice: body.entryPrice,
      entryAmount: body.entryAmount,
    });
    return { success: true, simulationId: simulation.id };
  }

  @Get("open")
  async getOpen() {
    const simulations = await this.simulationsService.findOpen();
    return { success: true, data: simulations };
  }

  @Put(":id/close")
  async close(
    @Param("id") id: string,
    @Body() body: { exitPrice: number; exitAmount: number }
  ) {
    const simulation = await this.simulationsService.close(
      parseInt(id),
      body.exitPrice,
      body.exitAmount
    );
    return { success: true, pnl: simulation.pnl };
  }

  @Get("stats")
  async getStats() {
    const stats = await this.simulationsService.getStats();
    return { success: true, data: stats };
  }
}
