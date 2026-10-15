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
import { DoctorsService } from "./doctors.service";
import { CreateDoctorDto, UpdateDoctorDto } from "./dto/create-doctor.dto";

@Controller("doctors")
@Injectable()
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Post()
  @AuditAction("DOCTOR_CREATE")
  @SkipCache()
  create(@Body() dto: CreateDoctorDto, @CurrentUser() user: { infrastructureId: string }) {
    return this.doctorsService.create(dto, user.infrastructureId);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("q") q?: string
  ) {
    return this.doctorsService.findAll(user.infrastructureId, q);
  }

  @Get(":id")
  @CacheTTL(60)
  findOne(@Param("id") id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(":id")
  @AuditAction("DOCTOR_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(":id")
  @AuditAction("DOCTOR_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.doctorsService.remove(id);
  }
}
