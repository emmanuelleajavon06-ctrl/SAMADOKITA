import { Controller, Get } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CacheTTL } from "../../common/decorators/cache.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@Injectable()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("stats")
  @CacheTTL(60)
  getStats(@CurrentUser() user: { infrastructureId: string; role: string }) {
    return this.dashboardService.getRoleStats(user);
  }
}
