import {
  reportDetailResponseSchema,
  reportListResponseSchema,
  reportMutationResponseSchema,
  type AddReportUpdateInput,
  type CreateReportInput,
  type ReportDetailResponse,
  type ReportListResponse,
  type ReportMutationResponse,
  type ReportStatus,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const reportKeys = {
  all: ["reports"] as const,
  list: (status?: ReportStatus) => ["reports", "list", status ?? "all"] as const,
  detail: (id: string) => ["reports", "detail", id] as const,
};

export function listReports(status?: ReportStatus, limit = 20): Promise<ReportListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status) query.set("status", status);
  return apiRequest(`/reports?${query.toString()}`, reportListResponseSchema);
}

export function getReport(id: string): Promise<ReportDetailResponse> {
  return apiRequest(`/reports/${encodeURIComponent(id)}`, reportDetailResponseSchema);
}

export function createReport(input: CreateReportInput): Promise<ReportMutationResponse> {
  return apiRequest("/reports", reportMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function addReportUpdate(
  id: string,
  input: AddReportUpdateInput,
): Promise<ReportMutationResponse> {
  return apiRequest(`/reports/${encodeURIComponent(id)}/updates`, reportMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
