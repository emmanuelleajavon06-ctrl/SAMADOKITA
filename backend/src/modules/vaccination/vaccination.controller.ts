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
import { VaccinationService } from "./vaccination.service";
import { CreateVaccinationDto, UpdateVaccinationDto } from "./dto/create-vaccination.dto";

@Controller("vaccination")
@Injectable()
export class VaccinationController {
  constructor(private vaccinationService: VaccinationService) {}

  @Post()
  @AuditAction("VACCINATION_CREATE")
  @SkipCache()
  create(
    @Body() dto: CreateVaccinationDto,
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.vaccinationService.create(dto, user.infrastructureId);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("patientId") patientId?: string
  ) {
    return this.vaccinationService.findAll(user, patientId);
  }

  @Get("carnet/:patientId")
  @CacheTTL(60)
  carnet(@Param("patientId") patientId: string) {
    return this.vaccinationService.findCarnet(patientId);
  }

  @Patch(":id")
  @AuditAction("VACCINATION_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdateVaccinationDto) {
    return this.vaccinationService.update(id, dto);
  }

  @Delete(":id")
  @AuditAction("VACCINATION_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.vaccinationService.remove(id);
  }
}
