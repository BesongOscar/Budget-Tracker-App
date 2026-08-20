import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async updatePushToken(userId: string, pushToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: pushToken },
    });

    return { message: "Push token saved" };
  }

  async removePushToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: null },
    });

    return { message: "Push token removed" };
  }

  async sendTestPush(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    if (!user?.expoPushToken) {
      throw new NotFoundException(
        "No push token registered. Call PATCH /users/me/push-token first.",
      );
    }

    const sent = await this.notificationsService.sendPush(user.expoPushToken, {
      title: "Budget Tracker test",
      body: "This is a test push notification.",
      data: { type: "TEST" },
    });

    if (!sent) {
      throw new BadGatewayException(
        "Expo rejected the push. Check server logs.",
      );
    }

    return { message: "Test push sent" };
  }
}
