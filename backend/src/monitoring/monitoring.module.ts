import { Module } from "@nestjs/common";
import { MonitoringService } from "./monitoring.service";
import { MonitoringController } from "./monitoring.controller";
import { AlertsModule } from "../alerts/alerts.module";

@Module({
  imports: [AlertsModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
