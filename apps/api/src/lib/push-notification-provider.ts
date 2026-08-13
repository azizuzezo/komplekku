import type { PrismaClient } from "@prisma/client";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class PushNotificationProvider {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Send a push notification payload to specific device tokens.
   */
  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

    // Log the notification payload for local-first testing
    console.log(
      `[PushNotification] Sending "${payload.title}" - "${payload.body}" to ${tokens.length} token(s):`,
      tokens,
    );

    // Simulated/local push delivery result
    return { successCount: tokens.length, failureCount: 0 };
  }

  /**
   * Broadcast push notification to all registered device tokens in a community.
   */
  async broadcastToCommunity(
    communityId: string,
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { communityId },
      select: { token: true },
    });

    const tokenStrings = tokens.map((t) => t.token);
    return this.sendToTokens(tokenStrings, payload);
  }

  /**
   * Send push notification to a specific user across all their registered devices.
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    const tokenStrings = tokens.map((t) => t.token);
    return this.sendToTokens(tokenStrings, payload);
  }
}
