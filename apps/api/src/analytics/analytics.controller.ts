import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import {
  AnalyticsSummaryDto,
  AnalyticsByCategoryDto,
  AnalyticsTrendDto,
} from "./dto/analytics-query.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { getPeriodMonth } from "../common/utils/date.utils";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("summary")
  getSummary(
    @CurrentUser("id") userId: string,
    @Query() query: AnalyticsSummaryDto,
  ) {
    const periodMonth = query.periodMonth ?? getPeriodMonth(new Date());
    return this.analyticsService.getSummary(userId, periodMonth);
  }

  @Get("by-category")
  getByCategory(
    @CurrentUser("id") userId: string,
    @Query() query: AnalyticsByCategoryDto,
  ) {
    const periodMonth = query.periodMonth ?? getPeriodMonth(new Date());
    return this.analyticsService.getByCategory(userId, periodMonth);
  }

  @Get("trend")
  getTrend(
    @CurrentUser("id") userId: string,
    @Query() query: AnalyticsTrendDto,
  ) {
    return this.analyticsService.getTrend(userId, query.months!);
  }
}
