import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { TeleconsultationService } from "./teleconsultation.service";

@Controller("teleconsultation")
@Injectable()
export class TeleconsultationController {
  constructor(private teleconsultationService: TeleconsultationService) {}

  @Post(":appointmentId/start")
  @AuditAction("TELECONSULT_START")
  @SkipCache()
  start(
    @Param("appointmentId") appointmentId: string,
    @CurrentUser("id") doctorId: string
  ) {
    return this.teleconsultationService.start(appointmentId, doctorId);
  }

  @Post(":appointmentId/end")
  @AuditAction("TELECONSULT_END")
  @SkipCache()
  end(@Param("appointmentId") appointmentId: string) {
    return this.teleconsultationService.end(appointmentId);
  }

  @Post(":appointmentId/chat")
  @AuditAction("TELECONSULT_CHAT")
  @SkipCache()
  pushChat(
    @Param("appointmentId") appointmentId: string,
    @Body() message: { senderId: string; content: string; sentAt: string }
  ) {
    return this.teleconsultationService.pushChat(appointmentId, message);
  }

  @Get(":appointmentId")
  @CacheTTL(30)
  findOne(@Param("appointmentId") appointmentId: string) {
    return this.teleconsultationService.findOne(appointmentId);
  }
}
