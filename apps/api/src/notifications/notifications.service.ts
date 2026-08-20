import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_ENDPOINT =
  process.env.EXPO_PUSH_ENDPOINT ?? "https://exp.host/--/api/v2/push/send";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendPush(token: string, payload: PushPayload): Promise<boolean> {
    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          to: token,
          title: payload.title,
          body: payload.body,
          sound: "default",
          data: payload.data,
        }),
      });

      const json: any = await response.json();

      const ticket = json?.data?.[0];
      if (ticket?.status === "error") {
        this.logger.error(
          `Expo push error: ${ticket.message ?? "unknown"} (${
            ticket.details?.error ?? ""
          })`,
        );
        if (
          ticket.details?.error === "DeviceNotRegistered" ||
          ticket.details?.error === "InvalidCredentials"
        ) {
          await this.clearPushToken(token);
        }
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error("Failed to send Expo push", error);
      return false;
    }
  }

  async notifyBudgetEvents(
    userId: string,
    events: string[],
    budget: any,
  ): Promise<void> {
    if (events.length === 0) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    if (!user?.expoPushToken) return;

    const categoryName = budget?.category?.name ?? "this category";
    const periodMonth = budget?.periodMonth;
    const categoryId = budget?.categoryId;

    for (const event of events) {
      if (event === "THRESHOLD_80") {
        await this.sendPush(user.expoPushToken, {
          title: "Budget almost reached",
          body: `You've used 80% of your ${categoryName} budget for ${periodMonth}.`,
          data: { type: "BUDGET_THRESHOLD_80", categoryId, periodMonth },
        });
      } else if (event === "OVER_BUDGET") {
        await this.sendPush(user.expoPushToken, {
          title: "Budget exceeded",
          body: `You've exceeded your ${categoryName} budget for ${periodMonth}.`,
          data: { type: "BUDGET_OVER", categoryId, periodMonth },
        });
      }
    }
  }

  async notifyOverAllocation(
    userId: string,
    periodMonth: string,
    summary: { income: number; allocated: number },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    if (!user?.expoPushToken) return;

    await this.sendPush(user.expoPushToken, {
      title: "Over-allocation warning",
      body: `Your allocations ($${summary.allocated.toFixed(
        2,
      )}) exceed your income ($${summary.income.toFixed(2)}) for ${periodMonth}.`,
      data: { type: "BUDGET_OVER_ALLOCATION", periodMonth },
    });
  }

  private async clearPushToken(token: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { expoPushToken: token },
      data: { expoPushToken: null },
    });
  }
}
