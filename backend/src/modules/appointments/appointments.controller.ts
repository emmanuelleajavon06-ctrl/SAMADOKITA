import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto, UpdateAppointmentDto } from "./dto/create-appointment.dto";

@Controller("appointments")
@Injectable()
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @AuditAction("APPOINTMENT_CREATE")
  @SkipCache()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: { infrastructureId: string }) {
    return this.appointmentsService.create(dto, user);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("cursor") cursor?: string,
    @Query("take") take = "20",
    @Query("status") status?: string,
    @Query("patientId") patientId?: string,
    @Query("doctorId") doctorId?: string
  ) {
    return this.appointmentsService.findAll(user, { cursor, take: Number(take), status, patientId, doctorId });
  }

  @Get(":id")
  @CacheTTL(60)
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.appointmentsService.findOne(id, user);
  }

  @Patch(":id")
  @AuditAction("APPOINTMENT_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Post(":id/cancel")
  @AuditAction("APPOINTMENT_CANCEL")
  @SkipCache()
  cancel(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.appointmentsService.cancel(id, user);
  }

  @Post(":id/confirm")
  @AuditAction("APPOINTMENT_CONFIRM")
  @SkipCache()
  confirm(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.appointmentsService.confirm(id, user);
  }

  @Delete(":id")
  @AuditAction("APPOINTMENT_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.appointmentsService.remove(id);
  }
}
