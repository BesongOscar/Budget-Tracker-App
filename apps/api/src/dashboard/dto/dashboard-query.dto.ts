import { IsOptional, IsString, Matches } from "class-validator";

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "periodMonth must be in YYYY-MM format" })
  periodMonth?: string;
}
