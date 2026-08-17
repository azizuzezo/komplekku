import {
  forumChannelListResponseSchema,
  forumMessageDeleteResponseSchema,
  forumMessageMutationResponseSchema,
  forumMessagePageResponseSchema,
  type CreateForumMessageInput,
  type ForumChannelListResponse,
  type ForumMessageMutationResponse,
  type ForumMessagePageResponse,
} from "@komplekku/contracts";

import { API_BASE_URL, apiRequest } from "@/lib/api/client";

export const forumKeys = {
  channels: ["forum-channels"] as const,
  messages: (channelId: string) => ["forum-messages", channelId] as const,
};

export function listForumChannels(): Promise<ForumChannelListResponse> {
  return apiRequest("/forum/channels", forumChannelListResponseSchema);
}

export function listForumMessages(input: {
  channelId: string;
  cursor?: string;
  limit?: number;
}): Promise<ForumMessagePageResponse> {
  const params = new URLSearchParams();
  if (input.cursor) params.set("cursor", input.cursor);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  return apiRequest(
    `/forum/channels/${input.channelId}/messages${query ? `?${query}` : ""}`,
    forumMessagePageResponseSchema,
  );
}

export function postForumMessage(input: {
  channelId: string;
  message: CreateForumMessageInput;
}): Promise<ForumMessageMutationResponse> {
  return apiRequest(
    `/forum/channels/${input.channelId}/messages`,
    forumMessageMutationResponseSchema,
    { method: "POST", body: input.message },
  );
}

export async function deleteForumMessage(messageId: string): Promise<void> {
  await apiRequest(`/forum/messages/${messageId}`, forumMessageDeleteResponseSchema, {
    method: "DELETE",
  });
}

export function forumChannelStreamUrl(channelId: string): string {
  return `${API_BASE_URL}/forum/channels/${channelId}/stream`;
}
