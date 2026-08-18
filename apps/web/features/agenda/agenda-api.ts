import {
  agendaDetailResponseSchema,
  agendaListResponseSchema,
  agendaMutationResponseSchema,
  type AgendaDetailResponse,
  type AgendaListResponse,
  type AgendaMutationResponse,
  archiveAgendaEventResponseSchema,
  type AgendaView,
  type ArchiveAgendaEventResponse,
  type CreateAgendaEventInput,
  type UpdateAgendaEventInput,
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

export function createAgendaEvent(data: CreateAgendaEventInput): Promise<AgendaMutationResponse> {
  return apiRequest("/admin/agenda", agendaMutationResponseSchema, {
    method: "POST",
    body: data,
  });
}

export function updateAgendaEvent(input: {
  id: string;
  changes: UpdateAgendaEventInput;
}): Promise<AgendaMutationResponse> {
  return apiRequest(`/admin/agenda/${encodeURIComponent(input.id)}`, agendaMutationResponseSchema, {
    method: "PATCH",
    body: input.changes,
  });
}

/** Archives rather than erases, matching the API — the kegiatan leaves the
 * calendar but its row stays for the audit trail. */
export function archiveAgendaEvent(id: string): Promise<ArchiveAgendaEventResponse> {
  return apiRequest(
    `/admin/agenda/${encodeURIComponent(id)}/archive`,
    archiveAgendaEventResponseSchema,
    { method: "POST" },
  );
}
