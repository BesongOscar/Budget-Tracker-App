import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { QueryBudgetsDto } from "./dto/query-budgets.dto";
import { CopyPeriodDto } from "./dto/copy-period.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { getPeriodMonth } from "../common/utils/date.utils";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(@CurrentUser("id") userId: string, @Query() query: QueryBudgetsDto) {
    const periodMonth =
      query.month ?? query.periodMonth ?? getPeriodMonth(new Date());
    return this.budgetsService.findAll(
      userId,
      periodMonth,
      query.status,
      query.categoryId,
    );
  }

  @Get(":id")
  findOne(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.budgetsService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser("id") userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(userId, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.budgetsService.remove(userId, id);
  }

  @Post("copy-period")
  copyPeriod(@CurrentUser("id") userId: string, @Body() dto: CopyPeriodDto) {
    return this.budgetsService.copyPeriod(userId, dto);
  }
}
