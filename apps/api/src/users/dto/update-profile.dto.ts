import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: "currencyCode must be a 3-letter ISO code" })
  currencyCode?: string;
}