import { IsNumber, Max, Min } from "class-validator";

export class UpdateBudgetDto {
  @IsNumber()
  @Min(0)
  @Max(999999999999.99)
  allocatedAmount: number;
}
