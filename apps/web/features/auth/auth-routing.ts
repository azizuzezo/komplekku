import type { AuthState } from "@komplekku/contracts";

const authDestinations: Record<AuthState, string> = {
  READY: "/",
  NEEDS_RESIDENCY: "/mulai/komunitas",
  PENDING_APPROVAL: "/menunggu-verifikasi",
  CONTEXT_REQUIRED: "/status-akun",
  REJECTED: "/status-akun",
  SUSPENDED: "/status-akun",
  ACCOUNT_CONFIGURATION_REQUIRED: "/status-akun",
};

export function destinationForAuthState(authState: AuthState) {
  return authDestinations[authState];
}

export function canStartResidencyRequest(authState: AuthState) {
  return authState === "NEEDS_RESIDENCY" || authState === "REJECTED";
}
