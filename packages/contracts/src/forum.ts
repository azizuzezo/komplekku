import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

/** SYSTEM = the seeded community-wide / per-RT "Forum Warga"; PRIVATE = a
 * forum a warga opened themselves, readable only by invited members who
 * accepted. */
export const forumChannelKindSchema = z.enum(["SYSTEM", "PRIVATE"]);
export type ForumChannelKind = z.infer<typeof forumChannelKindSchema>;

export const forumMemberStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);
export type ForumMemberStatus = z.infer<typeof forumMemberStatusSchema>;

export const forumChannelSchema = z.object({
  id: z.string().uuid(),
  rtId: z.string().uuid().nullable(),
  kind: forumChannelKindSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  createdByUserId: z.string().uuid().nullable(),
  /** The viewer's own membership. `null` on SYSTEM channels, which everyone in
   * scope can read without being invited. */
  membershipStatus: forumMemberStatusSchema.nullable(),
  isOwner: z.boolean(),
  memberCount: z.number().int().min(0),
});

export type ForumChannel = z.infer<typeof forumChannelSchema>;

export const forumChannelListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(forumChannelSchema) }),
);

export type ForumChannelListResponse = z.infer<typeof forumChannelListResponseSchema>;

export const createForumChannelInputSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(500).optional(),
    invitedUserIds: z.array(z.string().uuid()).max(100).default([]),
  })
  .strict();

export type CreateForumChannelInput = z.infer<typeof createForumChannelInputSchema>;

export const forumChannelMutationResponseSchema = dataEnvelopeSchema(
  z.object({ channel: forumChannelSchema }),
);

export type ForumChannelMutationResponse = z.infer<typeof forumChannelMutationResponseSchema>;

export const forumChannelMemberSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  houseLabel: z.string().nullable(),
  status: forumMemberStatusSchema,
  isOwner: z.boolean(),
});

export type ForumChannelMember = z.infer<typeof forumChannelMemberSchema>;

export const forumChannelMemberListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(forumChannelMemberSchema) }),
);

export type ForumChannelMemberListResponse = z.infer<typeof forumChannelMemberListResponseSchema>;

/** A resident with a linked account who can be invited into a private forum. */
export const forumMemberCandidateSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  houseLabel: z.string().nullable(),
});

export type ForumMemberCandidate = z.infer<typeof forumMemberCandidateSchema>;

export const forumMemberCandidateListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(forumMemberCandidateSchema) }),
);

export type ForumMemberCandidateListResponse = z.infer<
  typeof forumMemberCandidateListResponseSchema
>;

export const inviteForumMembersInputSchema = z
  .object({
    userIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .strict();

export type InviteForumMembersInput = z.infer<typeof inviteForumMembersInputSchema>;

export const respondForumInvitationInputSchema = z
  .object({
    accept: z.boolean(),
  })
  .strict();

export type RespondForumInvitationInput = z.infer<typeof respondForumInvitationInputSchema>;

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
  editedAt: z.string().datetime({ offset: true }).nullable(),
  replyToMessageId: z.string().uuid().nullable(),
  /** Denormalised quote of the parent message so a reply renders without a
   * second round-trip; both null when the parent was deleted. */
  replyToAuthorName: z.string().nullable(),
  replyToBody: z.string().nullable(),
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
    replyToMessageId: z.string().uuid().optional(),
  })
  .strict();

export type CreateForumMessageInput = z.infer<typeof createForumMessageInputSchema>;

export const updateForumMessageInputSchema = z
  .object({
    body: z.string().trim().min(1).max(2000),
    imageUrls: z.array(z.string().url()).max(5).optional(),
  })
  .strict();

export type UpdateForumMessageInput = z.infer<typeof updateForumMessageInputSchema>;

export const forumMessageMutationResponseSchema = dataEnvelopeSchema(
  z.object({ message: forumMessageSchema }),
);

export type ForumMessageMutationResponse = z.infer<typeof forumMessageMutationResponseSchema>;

export const forumMessageDeleteResponseSchema = dataEnvelopeSchema(
  z.object({ messageId: z.string().uuid() }),
);

export type ForumMessageDeleteResponse = z.infer<typeof forumMessageDeleteResponseSchema>;
