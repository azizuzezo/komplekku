import {
  facilityBookingListResponseSchema,
  facilityListResponseSchema,
  facilityBookingMutationResponseSchema,
  type CreateFacilityBookingInput,
  type FacilityBookingListResponse,
  type FacilityBookingMutationResponse,
  type FacilityListResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const facilityKeys = {
  list: ["facility", "list"] as const,
  bookings: (facilityId?: string, date?: string) =>
    ["facility", "bookings", facilityId ?? null, date ?? null] as const,
};

export function listFacilities(): Promise<FacilityListResponse> {
  return apiRequest("/facilities", facilityListResponseSchema);
}

export function listFacilityBookings(
  params: { facilityId?: string; date?: string; limit?: number } = {},
): Promise<FacilityBookingListResponse> {
  const query = new URLSearchParams();
  if (params.facilityId) query.set("facilityId", params.facilityId);
  if (params.date) query.set("date", params.date);
  if (params.limit) query.set("limit", String(params.limit));
  const search = query.toString();

  return apiRequest(
    `/facility-bookings${search ? `?${search}` : ""}`,
    facilityBookingListResponseSchema,
  );
}

export function createFacilityBooking(
  input: CreateFacilityBookingInput,
): Promise<FacilityBookingMutationResponse> {
  return apiRequest("/facility-bookings", facilityBookingMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function cancelFacilityBooking(id: string): Promise<FacilityBookingMutationResponse> {
  return apiRequest(
    `/facility-bookings/${encodeURIComponent(id)}/cancel`,
    facilityBookingMutationResponseSchema,
    { method: "POST" },
  );
}
