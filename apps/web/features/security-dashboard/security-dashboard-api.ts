import {
  securityDashboardResponseSchema,
  type SecurityDashboardResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const securityDashboardKeys = {
  root: ["security-dashboard"] as const,
};

export function getSecurityDashboard(): Promise<SecurityDashboardResponse> {
  return apiRequest("/security/dashboard", securityDashboardResponseSchema);
}
