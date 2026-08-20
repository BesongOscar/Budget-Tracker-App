import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CopyPeriodDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: "fromMonth must be in YYYY-MM format",
  })
  fromMonth: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: "toMonth must be in YYYY-MM format",
  })
  toMonth: string;
}
