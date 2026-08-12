import {
  financeDashboardResponseSchema,
  type FinanceDashboardResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const financeDashboardKeys = {
  root: ["finance-dashboard"] as const,
};

export function getFinanceDashboard(): Promise<FinanceDashboardResponse> {
  return apiRequest("/finance/dashboard", financeDashboardResponseSchema);
}
