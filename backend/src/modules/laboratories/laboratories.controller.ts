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
import { LaboratoriesService } from "./laboratories.service";
import { CreateLabResultDto, UpdateLabResultDto } from "./dto/create-lab-result.dto";

@Controller("laboratories")
@Injectable()
export class LaboratoriesController {
  constructor(private laboratoriesService: LaboratoriesService) {}

  @Post()
  @AuditAction("LAB_CREATE")
  @SkipCache()
  create(
    @Body() dto: CreateLabResultDto,
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.laboratoriesService.create(dto, user.infrastructureId);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("cursor") cursor?: string,
    @Query("take") take = "20",
    @Query("patientId") patientId?: string
  ) {
    return this.laboratoriesService.findAll(user, { cursor, take: Number(take), patientId });
  }

  @Get(":id")
  @CacheTTL(60)
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: { infrastructureId: string; role: string }
  ) {
    return this.laboratoriesService.findOne(id, user);
  }

  @Patch(":id")
  @AuditAction("LAB_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdateLabResultDto) {
    return this.laboratoriesService.update(id, dto);
  }

  @Delete(":id")
  @AuditAction("LAB_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.laboratoriesService.remove(id);
  }
}
