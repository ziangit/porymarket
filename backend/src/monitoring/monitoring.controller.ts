import { Controller, Post } from "@nestjs/common";
import { MonitoringService } from "./monitoring.service";

@Controller("monitoring")
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post("scan")
  async triggerScan() {
    await this.monitoringService.scanMarkets();
    return { success: true, message: "Scan triggered" };
  }
}
