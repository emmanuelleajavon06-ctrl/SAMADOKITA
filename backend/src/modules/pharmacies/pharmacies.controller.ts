import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { PharmaciesService } from "./pharmacies.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";

@Controller("pharmacies")
@Injectable()
export class PharmaciesController {
  constructor(private pharmaciesService: PharmaciesService) {}

  @Post()
  @AuditAction("PHARMACY_CREATE")
  @SkipCache()
  create(
    @Body() dto: CreatePharmacyDto,
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.pharmaciesService.create(dto, user.infrastructureId);
  }

  @Get()
  @CacheTTL(60)
  findAll(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("lat") lat?: string,
    @Query("lng") lng?: string,
    @Query("radiusKm") radiusKm?: string
  ) {
    if (lat && lng) {
      return this.pharmaciesService.findAll(undefined, {
        lat: Number(lat),
        lng: Number(lng),
        radiusKm: Number(radiusKm ?? 5),
      });
    }
    return this.pharmaciesService.findAll(user.infrastructureId);
  }

  @Get(":id")
  @CacheTTL(60)
  findOne(@Param("id") id: string) {
    return this.pharmaciesService.findOne(id);
  }

  @Delete(":id")
  @AuditAction("PHARMACY_DELETE")
  @SkipCache()
  remove(@Param("id") id: string) {
    return this.pharmaciesService.remove(id);
  }
}
