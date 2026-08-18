import type { ServerResponse } from "node:http";

export type ForumBroadcastEvent =
  | { type: "message.created"; channelId: string; messageId: string }
  | { type: "message.updated"; channelId: string; messageId: string }
  | { type: "message.deleted"; channelId: string; messageId: string };

/**
 * In-process SSE fan-out, keyed by forum channel. This is deliberately not
 * backed by Redis pub/sub — the API runs as a single local-first process, so
 * an in-memory Map is sufficient and avoids adding realtime infra the rest
 * of the app has never needed. Revisit only if the API is ever run with more
 * than one instance.
 */
class ForumBroadcaster {
  private readonly subscribers = new Map<string, Set<ServerResponse>>();

  subscribe(channelId: string, response: ServerResponse): () => void {
    const existing = this.subscribers.get(channelId) ?? new Set<ServerResponse>();
    existing.add(response);
    this.subscribers.set(channelId, existing);
    return () => {
      existing.delete(response);
      if (existing.size === 0) this.subscribers.delete(channelId);
    };
  }

  emit(event: ForumBroadcastEvent): void {
    const targets = this.subscribers.get(event.channelId);
    if (!targets || targets.size === 0) return;
    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const response of targets) {
      response.write(payload);
    }
  }
}

export const forumBroadcaster = new ForumBroadcaster();
