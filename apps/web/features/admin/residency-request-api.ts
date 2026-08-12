import {
  adminResidencyRequestListResponseSchema,
  approveResidencyRequestResponseSchema,
  rejectResidencyRequestResponseSchema,
  type AdminResidencyRequestListResponse,
  type ApproveResidencyRequestResponse,
  type RejectResidencyRequestInput,
  type RejectResidencyRequestResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const residencyRequestKeys = {
  all: ["admin", "residency-requests"] as const,
  pending: ["admin", "residency-requests", "pending"] as const,
};

export function getPendingResidencyRequests(
  limit = 100,
): Promise<AdminResidencyRequestListResponse> {
  return apiRequest(
    `/admin/residency-requests?limit=${encodeURIComponent(String(limit))}`,
    adminResidencyRequestListResponseSchema,
  );
}

export function approveResidencyRequest(id: string): Promise<ApproveResidencyRequestResponse> {
  return apiRequest(
    `/admin/residency-requests/${encodeURIComponent(id)}/approve`,
    approveResidencyRequestResponseSchema,
    { method: "POST" },
  );
}

export function rejectResidencyRequest({
  id,
  input,
}: {
  id: string;
  input: RejectResidencyRequestInput;
}): Promise<RejectResidencyRequestResponse> {
  return apiRequest(
    `/admin/residency-requests/${encodeURIComponent(id)}/reject`,
    rejectResidencyRequestResponseSchema,
    { method: "POST", body: input },
  );
}
