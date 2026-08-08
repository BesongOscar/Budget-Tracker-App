import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetBudgetDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  periodMonth?: string;
}
