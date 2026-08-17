import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const forumChannelSchema = z.object({
  id: z.string().uuid(),
  rtId: z.string().uuid().nullable(),
  name: z.string().min(1),
});

export type ForumChannel = z.infer<typeof forumChannelSchema>;

export const forumChannelListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(forumChannelSchema) }),
);

export type ForumChannelListResponse = z.infer<typeof forumChannelListResponseSchema>;

export const forumMessageListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export type ForumMessageListQuery = z.infer<typeof forumMessageListQuerySchema>;

export const forumMessageSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  authorUserId: z.string().uuid(),
  authorName: z.string().min(1),
  body: z.string().min(1),
  imageUrls: z.array(z.string().url()),
  createdAt: z.string().datetime({ offset: true }),
});

export type ForumMessage = z.infer<typeof forumMessageSchema>;

export const forumMessagePageResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(forumMessageSchema) }),
);

export type ForumMessagePageResponse = z.infer<typeof forumMessagePageResponseSchema>;

export const createForumMessageInputSchema = z
  .object({
    body: z.string().trim().min(1).max(2000),
    imageUrls: z.array(z.string().url()).max(5).default([]),
  })
  .strict();

export type CreateForumMessageInput = z.infer<typeof createForumMessageInputSchema>;

export const forumMessageMutationResponseSchema = dataEnvelopeSchema(
  z.object({ message: forumMessageSchema }),
);

export type ForumMessageMutationResponse = z.infer<typeof forumMessageMutationResponseSchema>;

export const forumMessageDeleteResponseSchema = dataEnvelopeSchema(
  z.object({ messageId: z.string().uuid() }),
);

export type ForumMessageDeleteResponse = z.infer<typeof forumMessageDeleteResponseSchema>;
