import { homeResponseSchema, type HomeResponse } from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export function getHome(): Promise<HomeResponse> {
  return apiRequest("/home", homeResponseSchema);
}
