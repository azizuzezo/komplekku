import {
  agendaDetailResponseSchema,
  agendaListResponseSchema,
  type AgendaDetailResponse,
  type AgendaListResponse,
  type AgendaView,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const agendaKeys = {
  all: ["agenda"] as const,
  list: (view: AgendaView) => ["agenda", "list", view] as const,
  preview: ["agenda", "preview", "upcoming"] as const,
  detail: (id: string) => ["agenda", "detail", id] as const,
};

export type AgendaPageParams = {
  view: AgendaView;
  cursor?: string;
  limit?: number;
};

export function agendaListPath({ view, cursor, limit = 20 }: AgendaPageParams) {
  const query = new URLSearchParams({ view, limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  return `/agenda?${query.toString()}`;
}

export function getAgendaPage(params: AgendaPageParams): Promise<AgendaListResponse> {
  return apiRequest(agendaListPath(params), agendaListResponseSchema);
}

export function getAgendaEvent(id: string): Promise<AgendaDetailResponse> {
  return apiRequest(`/agenda/${encodeURIComponent(id)}`, agendaDetailResponseSchema);
}
