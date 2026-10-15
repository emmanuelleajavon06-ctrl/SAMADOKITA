import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from "@nestjs/common";
import { Observable, interval } from "rxjs";
import { map } from "rxjs/operators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { EmergencyService } from "./emergency.service";
import { CreateEmergencyDto, UpdateEmergencyDto } from "./dto/create-emergency.dto";

@Controller("emergency")
@Injectable()
export class EmergencyController {
  constructor(private emergencyService: EmergencyService) {}

  @Post()
  @AuditAction("EMERGENCY_CREATE")
  @SkipCache()
  create(
    @Body() dto: CreateEmergencyDto,
    @CurrentUser() user: { id: string; infrastructureId: string }
  ) {
    return this.emergencyService.create(dto, user);
  }

  @Get()
  @CacheTTL(30)
  findAll(@Query("status") status?: string) {
    return this.emergencyService.findAll(status);
  }

  @Get(":id")
  @CacheTTL(30)
  findOne(@Param("id") id: string) {
    return this.emergencyService.findOne(id);
  }

  @Patch(":id")
  @AuditAction("EMERGENCY_UPDATE")
  @SkipCache()
  update(@Param("id") id: string, @Body() dto: UpdateEmergencyDto) {
    return this.emergencyService.update(id, dto);
  }

  @Post(":id/resolve")
  @AuditAction("EMERGENCY_RESOLVE")
  @SkipCache()
  resolve(@Param("id") id: string) {
    return this.emergencyService.resolve(id);
  }

  @Sse("stream")
  @SkipCache()
  stream(): Observable<MessageEvent> {
    return interval(3000).pipe(
      map(() => ({
        data: { timestamp: new Date().toISOString(), type: "ping" },
      }))
    );
  }
}
