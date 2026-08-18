import {
  forumLikeResponseSchema,
  forumPostDeleteResponseSchema,
  forumPostDetailResponseSchema,
  forumPostListResponseSchema,
  forumPostMutationResponseSchema,
  forumPostReplyMutationResponseSchema,
  forumReplyDeleteResponseSchema,
  type CreateForumPostInput,
  type CreateForumPostReplyInput,
  type ForumLikeResponse,
  type ForumPostCategory,
  type ForumPostDetailResponse,
  type ForumPostListResponse,
  type ForumPostMutationResponse,
  type ForumPostReplyMutationResponse,
  type ForumPostSort,
  type UpdateForumPostInput,
  type UpdateForumPostReplyInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const forumPostKeys = {
  all: ["forum-posts"] as const,
  list: (sort: ForumPostSort, category: ForumPostCategory | "all") =>
    ["forum-posts", sort, category] as const,
  detail: (postId: string) => ["forum-post", postId] as const,
};

export function listForumPosts(input: {
  sort: ForumPostSort;
  category?: ForumPostCategory;
}): Promise<ForumPostListResponse> {
  const params = new URLSearchParams({ sort: input.sort });
  if (input.category) params.set("category", input.category);
  return apiRequest(`/forum/posts?${params.toString()}`, forumPostListResponseSchema);
}

export function getForumPost(postId: string): Promise<ForumPostDetailResponse> {
  return apiRequest(`/forum/posts/${postId}`, forumPostDetailResponseSchema);
}

export function createForumPost(input: CreateForumPostInput): Promise<ForumPostMutationResponse> {
  return apiRequest("/forum/posts", forumPostMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function updateForumPost(input: {
  postId: string;
  changes: UpdateForumPostInput;
}): Promise<ForumPostMutationResponse> {
  return apiRequest(`/forum/posts/${input.postId}`, forumPostMutationResponseSchema, {
    method: "PATCH",
    body: input.changes,
  });
}

export async function deleteForumPost(postId: string): Promise<void> {
  await apiRequest(`/forum/posts/${postId}`, forumPostDeleteResponseSchema, {
    method: "DELETE",
  });
}

export function toggleForumPostLike(postId: string): Promise<ForumLikeResponse> {
  return apiRequest(`/forum/posts/${postId}/like`, forumLikeResponseSchema, {
    method: "POST",
  });
}

export function createForumPostReply(input: {
  postId: string;
  reply: CreateForumPostReplyInput;
}): Promise<ForumPostReplyMutationResponse> {
  return apiRequest(`/forum/posts/${input.postId}/replies`, forumPostReplyMutationResponseSchema, {
    method: "POST",
    body: input.reply,
  });
}

export function updateForumPostReply(input: {
  replyId: string;
  reply: UpdateForumPostReplyInput;
}): Promise<ForumPostReplyMutationResponse> {
  return apiRequest(`/forum/replies/${input.replyId}`, forumPostReplyMutationResponseSchema, {
    method: "PATCH",
    body: input.reply,
  });
}

export async function deleteForumPostReply(replyId: string): Promise<void> {
  await apiRequest(`/forum/replies/${replyId}`, forumReplyDeleteResponseSchema, {
    method: "DELETE",
  });
}

export function toggleForumReplyLike(replyId: string): Promise<ForumLikeResponse> {
  return apiRequest(`/forum/replies/${replyId}/like`, forumLikeResponseSchema, {
    method: "POST",
  });
}
