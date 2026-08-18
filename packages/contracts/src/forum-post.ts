import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

/**
 * The threaded "Forum Warga" board.
 *
 * This lives alongside the chat channels in `forum.ts` rather than replacing
 * them: a post has a title, a category, likes, and replies, none of which a
 * chat message has. The Forum tab shows both, as two modes.
 */
export const forumPostCategorySchema = z.enum([
  "QUESTION",
  "SUGGESTION",
  "INFORMATION",
  "ENVIRONMENT",
  "ACTIVITY",
]);

export type ForumPostCategory = z.infer<typeof forumPostCategorySchema>;

export const FORUM_POST_CATEGORY_LABELS: Record<ForumPostCategory, string> = {
  QUESTION: "Tanya Warga",
  SUGGESTION: "Usulan",
  INFORMATION: "Informasi",
  ENVIRONMENT: "Info Lingkungan",
  ACTIVITY: "Ide & Kegiatan",
};

/** `answered` keeps only posts that already have at least one reply, so a
 * warga can skip past the questions nobody has picked up yet. */
export const forumPostSortSchema = z.enum(["latest", "popular", "answered"]);

export type ForumPostSort = z.infer<typeof forumPostSortSchema>;

export const FORUM_POST_SORT_LABELS: Record<ForumPostSort, string> = {
  latest: "Terbaru",
  popular: "Populer",
  answered: "Terjawab",
};

export const forumPostListQuerySchema = z.object({
  sort: forumPostSortSchema.default("latest"),
  category: forumPostCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ForumPostListQuery = z.infer<typeof forumPostListQuerySchema>;

const authoredFields = {
  authorUserId: z.string().uuid(),
  authorName: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  editedAt: z.string().datetime({ offset: true }).nullable(),
  likeCount: z.number().int().min(0),
  /** Whether the viewer has liked it — the heart is per-person, so this cannot
   * be derived from `likeCount`. */
  likedByMe: z.boolean(),
} as const;

export const forumPostSummarySchema = z.object({
  id: z.string().uuid(),
  category: forumPostCategorySchema,
  title: z.string().min(1),
  /** First lines of the body, for the card on the board. */
  excerpt: z.string(),
  imageUrls: z.array(z.string().url()),
  replyCount: z.number().int().min(0),
  ...authoredFields,
});

export type ForumPostSummary = z.infer<typeof forumPostSummarySchema>;

export const forumPostReplySchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  body: z.string().min(1),
  replyToReplyId: z.string().uuid().nullable(),
  /** Denormalised quote of the reply being answered; null when it was
   * deleted, so the thread never resurrects removed content. */
  replyToAuthorName: z.string().nullable(),
  replyToBody: z.string().nullable(),
  ...authoredFields,
});

export type ForumPostReply = z.infer<typeof forumPostReplySchema>;

export const forumPostDetailSchema = forumPostSummarySchema.extend({
  body: z.string().min(1),
  replies: z.array(forumPostReplySchema),
});

export type ForumPostDetail = z.infer<typeof forumPostDetailSchema>;

export const forumPostListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(forumPostSummarySchema) }),
);

export type ForumPostListResponse = z.infer<typeof forumPostListResponseSchema>;

export const forumPostDetailResponseSchema = dataEnvelopeSchema(
  z.object({ post: forumPostDetailSchema }),
);

export type ForumPostDetailResponse = z.infer<typeof forumPostDetailResponseSchema>;

export const forumPostMutationResponseSchema = dataEnvelopeSchema(
  z.object({ post: forumPostSummarySchema }),
);

export type ForumPostMutationResponse = z.infer<typeof forumPostMutationResponseSchema>;

export const forumPostReplyMutationResponseSchema = dataEnvelopeSchema(
  z.object({ reply: forumPostReplySchema }),
);

export type ForumPostReplyMutationResponse = z.infer<
  typeof forumPostReplyMutationResponseSchema
>;

export const createForumPostInputSchema = z
  .object({
    category: forumPostCategorySchema.default("INFORMATION"),
    title: z.string().trim().min(5).max(240),
    body: z.string().trim().min(10).max(5_000),
    imageUrls: z.array(z.string().url()).max(5).default([]),
  })
  .strict();

export type CreateForumPostInput = z.infer<typeof createForumPostInputSchema>;

export const updateForumPostInputSchema = z
  .object({
    category: forumPostCategorySchema.optional(),
    title: z.string().trim().min(5).max(240).optional(),
    body: z.string().trim().min(10).max(5_000).optional(),
    imageUrls: z.array(z.string().url()).max(5).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan.",
  });

export type UpdateForumPostInput = z.infer<typeof updateForumPostInputSchema>;

export const createForumPostReplyInputSchema = z
  .object({
    body: z.string().trim().min(1).max(2_000),
    replyToReplyId: z.string().uuid().optional(),
  })
  .strict();

export type CreateForumPostReplyInput = z.infer<typeof createForumPostReplyInputSchema>;

export const updateForumPostReplyInputSchema = z
  .object({ body: z.string().trim().min(1).max(2_000) })
  .strict();

export type UpdateForumPostReplyInput = z.infer<typeof updateForumPostReplyInputSchema>;

export const forumLikeResponseSchema = dataEnvelopeSchema(
  z.object({
    likeCount: z.number().int().min(0),
    likedByMe: z.boolean(),
  }),
);

export type ForumLikeResponse = z.infer<typeof forumLikeResponseSchema>;

export const forumPostDeleteResponseSchema = dataEnvelopeSchema(
  z.object({ postId: z.string().uuid() }),
);

export type ForumPostDeleteResponse = z.infer<typeof forumPostDeleteResponseSchema>;

export const forumReplyDeleteResponseSchema = dataEnvelopeSchema(
  z.object({ replyId: z.string().uuid() }),
);

export type ForumReplyDeleteResponse = z.infer<typeof forumReplyDeleteResponseSchema>;
