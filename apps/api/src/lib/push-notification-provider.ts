import type { PrismaClient } from "@prisma/client";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

function createMessaging(serviceAccountKey: string | undefined): Messaging | undefined {
  if (!serviceAccountKey) return undefined;
  const serviceAccount = JSON.parse(serviceAccountKey);
  const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
  return getMessaging(app);
}

export class PushNotificationProvider {
  private readonly messaging?: Messaging;

  constructor(
    private readonly prisma: PrismaClient,
    firebaseServiceAccountKey?: string,
  ) {
    this.messaging = createMessaging(firebaseServiceAccountKey);
  }

  /**
   * Send a push notification payload to specific device tokens.
   */
  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

    if (!this.messaging) {
      // No Firebase credentials configured: log instead of sending for local-first testing.
      console.log(
        `[PushNotification] Sending "${payload.title}" - "${payload.body}" to ${tokens.length} token(s):`,
        tokens,
      );
      return { successCount: tokens.length, failureCount: 0 };
    }

    const response = await this.messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
    return { successCount: response.successCount, failureCount: response.failureCount };
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
