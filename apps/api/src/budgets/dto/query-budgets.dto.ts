import { IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { BudgetStatus } from "@prisma/client";

export class QueryBudgetsDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "month must be in YYYY-MM format" })
  month?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: "periodMonth must be in YYYY-MM format",
  })
  periodMonth?: string;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
