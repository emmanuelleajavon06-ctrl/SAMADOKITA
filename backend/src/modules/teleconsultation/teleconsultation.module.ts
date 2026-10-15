import { Module } from "@nestjs/common";
import { TeleconsultationController } from "./teleconsultation.controller";
import { TeleconsultationService } from "./teleconsultation.service";

@Module({
  controllers: [TeleconsultationController],
  providers: [TeleconsultationService],
  exports: [TeleconsultationService],
})
export class TeleconsultationModule {}
