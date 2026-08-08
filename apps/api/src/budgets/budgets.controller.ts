import { Controller, Get, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { GetBudgetDto } from './dto/get-budget.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getPeriodMonth } from '../common/utils/date.utils';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findOne(
    @CurrentUser('id') userId: string,
    @Query() query: GetBudgetDto,
  ) {
    const periodMonth = query.periodMonth ?? getPeriodMonth(new Date());
    return this.budgetsService.getBudgetForPeriod(
      userId,
      query.categoryId,
      periodMonth,
    );
  }
}
