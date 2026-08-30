import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { getPeriodMonth } from "../common/utils/date.utils";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    const periodMonth = query.periodMonth ?? getPeriodMonth(new Date());
    return this.dashboardService.getDashboard(userId, periodMonth);
  }
}
