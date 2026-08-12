import {
  packageListResponseSchema,
  packageMutationResponseSchema,
  type CollectPackageInput,
  type CreatePackageInput,
  type PackageListResponse,
  type PackageMutationResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const packageKeys = {
  all: ["packages"] as const,
  list: (limit?: number) => ["packages", "list", limit ?? 20] as const,
};

export function createPackage(input: CreatePackageInput): Promise<PackageMutationResponse> {
  return apiRequest("/packages", packageMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function listPackages(limit = 20): Promise<PackageListResponse> {
  return apiRequest(`/packages?limit=${limit}`, packageListResponseSchema);
}

export function collectPackage(
  id: string,
  input: CollectPackageInput,
): Promise<PackageMutationResponse> {
  return apiRequest(`/packages/${encodeURIComponent(id)}/collect`, packageMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
