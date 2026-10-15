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
import { PatientsService } from "./patients.service";

@Controller("patients")
@Injectable()
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @AuditAction("PATIENT_CREATE")
  @SkipCache()
  create(@Body() dto: never, @CurrentUser() user: { id: string; infrastructureId: string }) {
    return this.patientsService.create(dto as never, user);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("cursor") cursor?: string,
    @Query("take") take = "20",
    @Query("q") q?: string
  ) {
    return this.patientsService.findAll(user, { cursor, take: Number(take), q });
  }

  @Get(":id")
  @CacheTTL(60)
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.patientsService.findOne(id, user);
  }

  @Patch(":id")
  @AuditAction("PATIENT_UPDATE")
  @SkipCache()
  update(
    @Param("id") id: string,
    @Body() dto: never,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.patientsService.update(id, dto as never, user);
  }

  @Delete(":id")
  @AuditAction("PATIENT_DELETE")
  @SkipCache()
  remove(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.patientsService.remove(id, user);
  }
}
