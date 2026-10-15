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
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@Injectable()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @CacheTTL(30)
  findAll(
    @CurrentUser() user: { id: string },
    @Query("cursor") cursor?: string,
    @Query("take") take = "20",
    @Query("unreadOnly") unreadOnly?: string
  ) {
    return this.notificationsService.findAll(user, {
      cursor,
      take: Number(take),
      unreadOnly: unreadOnly === "true",
    });
  }

  @Post()
  @AuditAction("NOTIFICATION_CREATE")
  @SkipCache()
  create(
    @Body() dto: { userId: string; title: string; message: string; type: string; data?: unknown }
  ) {
    return this.notificationsService.create(dto);
  }

  @Patch(":id/read")
  @AuditAction("NOTIFICATION_READ")
  @SkipCache()
  markRead(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Post("read-all")
  @AuditAction("NOTIFICATION_READ_ALL")
  @SkipCache()
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Delete(":id")
  @AuditAction("NOTIFICATION_DELETE")
  @SkipCache()
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.remove(id, user.id);
  }
}
