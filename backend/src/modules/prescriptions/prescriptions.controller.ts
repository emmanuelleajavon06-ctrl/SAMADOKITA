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
import { PrescriptionsService } from "./prescriptions.service";
import { CreatePrescriptionDto, UpdatePrescriptionDto } from "./dto/create-prescription.dto";

@Controller("prescriptions")
@Injectable()
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @AuditAction("PRESCRIPTION_CREATE")
  @SkipCache()
  create(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: { id: string; infrastructureId: string }
  ) {
    return this.prescriptionsService.create(dto, user.id, user.infrastructureId);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("cursor") cursor?: string,
    @Query("take") take = "20",
    @Query("patientId") patientId?: string
  ) {
    return this.prescriptionsService.findAll(user, { cursor, take: Number(take), patientId });
  }

  @Get("scan/:qrCode")
  @CacheTTL(30)
  scan(@Param("qrCode") qrCode: string) {
    return this.prescriptionsService.scan(qrCode);
  }

  @Get(":id")
  @CacheTTL(60)
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.prescriptionsService.findOne(id, user);
  }

  @Patch(":id")
  @AuditAction("PRESCRIPTION_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.prescriptionsService.update(id, dto);
  }

  @Delete(":id")
  @AuditAction("PRESCRIPTION_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.prescriptionsService.remove(id);
  }
}
