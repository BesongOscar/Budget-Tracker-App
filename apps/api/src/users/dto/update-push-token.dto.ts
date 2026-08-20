import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class UpdatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$/, {
    message: "pushToken must be a valid Expo push token",
  })
  pushToken: string;
}
