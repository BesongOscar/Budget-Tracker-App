import { IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class AnalyticsSummaryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "periodMonth must be in YYYY-MM format" })
  periodMonth?: string;
}

export class AnalyticsByCategoryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "periodMonth must be in YYYY-MM format" })
  periodMonth?: string;
}

export class AnalyticsTrendDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(12)
  months?: number = 6;
}
