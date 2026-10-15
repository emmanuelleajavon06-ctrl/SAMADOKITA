import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { PregnancyService } from "./pregnancy.service";
import { CreatePregnancyDto, UpdatePregnancyDto } from "./dto/create-pregnancy.dto";

@Controller("pregnancy")
@Injectable()
export class PregnancyController {
  constructor(private pregnancyService: PregnancyService) {}

  @Post()
  @AuditAction("PREGNANCY_CREATE")
  @SkipCache()
  create(
    @Body() dto: CreatePregnancyDto,
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.pregnancyService.create(dto, user.infrastructureId);
  }

  @Get(":patientId")
  @CacheTTL(60)
  findOne(@Param("patientId") patientId: string) {
    return this.pregnancyService.findOne(patientId);
  }

  @Patch(":id")
  @AuditAction("PREGNANCY_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdatePregnancyDto) {
    return this.pregnancyService.update(id, dto);
  }

  @Delete(":id")
  @AuditAction("PREGNANCY_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.pregnancyService.remove(id);
  }
}
