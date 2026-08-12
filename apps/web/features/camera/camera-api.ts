import {
  cameraListResponseSchema,
  streamTicketResponseSchema,
  type CameraListResponse,
  type StreamTicketResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const cameraKeys = {
  list: ["cameras", "list"] as const,
};

export function listCameras(): Promise<CameraListResponse> {
  return apiRequest("/cameras", cameraListResponseSchema);
}

export function issueStreamTicket(cameraId: string): Promise<StreamTicketResponse> {
  return apiRequest(
    `/cameras/${encodeURIComponent(cameraId)}/stream-ticket`,
    streamTicketResponseSchema,
    { method: "POST" },
  );
}
