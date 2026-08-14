import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const notificationPrioritySchema = z.enum(["NORMAL", "IMPORTANT", "URGENT"]);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const notificationEntityTypeSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Z][A-Z0-9_]*$/, "Jenis entitas notifikasi tidak valid.");

export const notificationListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().min(1),
  readAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  entityType: notificationEntityTypeSchema,
  entityId: z.string().uuid().nullable(),
  priority: notificationPrioritySchema,
});

export type Notification = z.infer<typeof notificationSchema>;

export const notificationListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(notificationSchema) }),
);

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

export const notificationUnreadCountResponseSchema = dataEnvelopeSchema(
  z.object({ unreadCount: z.number().int().nonnegative() }),
);

export type NotificationUnreadCountResponse = z.infer<typeof notificationUnreadCountResponseSchema>;

export const markNotificationReadResponseSchema = dataEnvelopeSchema(
  z.object({
    notificationId: z.string().uuid(),
    readAt: z.string().datetime({ offset: true }),
  }),
);

export type MarkNotificationReadResponse = z.infer<typeof markNotificationReadResponseSchema>;

export const markAllNotificationsReadResponseSchema = dataEnvelopeSchema(
  z.object({
    readAt: z.string().datetime({ offset: true }),
    updatedCount: z.number().int().nonnegative(),
  }),
);

export type MarkAllNotificationsReadResponse = z.infer<
  typeof markAllNotificationsReadResponseSchema
>;

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, "Token tidak boleh kosong"),
  platform: z.enum(["ANDROID", "IOS", "WEB"]).default("ANDROID"),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

export const testPushNotificationResponseSchema = dataEnvelopeSchema(
  z.object({
    successCount: z.number().int().nonnegative(),
    failureCount: z.number().int().nonnegative(),
  }),
);

export type TestPushNotificationResponse = z.infer<typeof testPushNotificationResponseSchema>;
