import { IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class QueryCategoriesDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
