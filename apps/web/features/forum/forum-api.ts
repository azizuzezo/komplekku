import {
  forumChannelListResponseSchema,
  forumChannelMemberListResponseSchema,
  forumChannelMutationResponseSchema,
  forumMemberCandidateListResponseSchema,
  forumMessageDeleteResponseSchema,
  forumMessageMutationResponseSchema,
  forumMessagePageResponseSchema,
  type CreateForumChannelInput,
  type CreateForumMessageInput,
  type ForumChannelListResponse,
  type ForumChannelMemberListResponse,
  type ForumChannelMutationResponse,
  type ForumMemberCandidateListResponse,
  type ForumMessageMutationResponse,
  type ForumMessagePageResponse,
  type UpdateForumMessageInput,
} from "@komplekku/contracts";

import { API_BASE_URL, apiRequest } from "@/lib/api/client";

export const forumKeys = {
  channels: ["forum-channels"] as const,
  members: (channelId: string) => ["forum-members", channelId] as const,
  candidates: ["forum-member-candidates"] as const,
  messages: (channelId: string) => ["forum-messages", channelId] as const,
};

export function listForumChannels(): Promise<ForumChannelListResponse> {
  return apiRequest("/forum/channels", forumChannelListResponseSchema);
}

export function createForumChannel(
  input: CreateForumChannelInput,
): Promise<ForumChannelMutationResponse> {
  return apiRequest("/forum/channels", forumChannelMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function listForumChannelMembers(
  channelId: string,
): Promise<ForumChannelMemberListResponse> {
  return apiRequest(`/forum/channels/${channelId}/members`, forumChannelMemberListResponseSchema);
}

export function listForumMemberCandidates(): Promise<ForumMemberCandidateListResponse> {
  return apiRequest("/forum/member-candidates", forumMemberCandidateListResponseSchema);
}

export function inviteForumMembers(input: {
  channelId: string;
  userIds: string[];
}): Promise<ForumChannelMutationResponse> {
  return apiRequest(
    `/forum/channels/${input.channelId}/invitations`,
    forumChannelMutationResponseSchema,
    { method: "POST", body: { userIds: input.userIds } },
  );
}

export function respondForumInvitation(input: {
  channelId: string;
  accept: boolean;
}): Promise<ForumChannelMutationResponse> {
  return apiRequest(
    `/forum/channels/${input.channelId}/invitation`,
    forumChannelMutationResponseSchema,
    { method: "POST", body: { accept: input.accept } },
  );
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

export function updateForumMessage(input: {
  messageId: string;
  message: UpdateForumMessageInput;
}): Promise<ForumMessageMutationResponse> {
  return apiRequest(`/forum/messages/${input.messageId}`, forumMessageMutationResponseSchema, {
    method: "PATCH",
    body: input.message,
  });
}

export async function deleteForumMessage(messageId: string): Promise<void> {
  await apiRequest(`/forum/messages/${messageId}`, forumMessageDeleteResponseSchema, {
    method: "DELETE",
  });
}

export function forumChannelStreamUrl(channelId: string): string {
  return `${API_BASE_URL}/forum/channels/${channelId}/stream`;
}
