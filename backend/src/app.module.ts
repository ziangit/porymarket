import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AlertsModule } from "./alerts/alerts.module";
import { MarketsModule } from "./markets/markets.module";
import { SimulationsModule } from "./simulations/simulations.module";
import { MonitoringModule } from "./monitoring/monitoring.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AlertsModule,
    MarketsModule,
    SimulationsModule,
    MonitoringModule,
  ],
})
export class AppModule {}
