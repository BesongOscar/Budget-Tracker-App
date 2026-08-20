import { Body, Controller, Delete, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdatePushTokenDto } from "./dto/update-push-token.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("me/push-token")
  updatePushToken(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdatePushTokenDto,
  ) {
    return this.usersService.updatePushToken(userId, dto.pushToken);
  }

  @Delete("me/push-token")
  removePushToken(@CurrentUser("id") userId: string) {
    return this.usersService.removePushToken(userId);
  }

  @Post("me/push-token/test")
  sendTestPush(@CurrentUser("id") userId: string) {
    return this.usersService.sendTestPush(userId);
  }
}
