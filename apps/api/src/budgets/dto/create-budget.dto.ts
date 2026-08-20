import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: "periodMonth must be in YYYY-MM format",
  })
  periodMonth?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  allocatedAmount?: number;
}
