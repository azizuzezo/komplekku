import {
  duesTypeListResponseSchema,
  duesTypeMutationResponseSchema,
  generateInvoicesResponseSchema,
  invoiceDetailResponseSchema,
  invoiceListResponseSchema,
  invoiceMutationResponseSchema,
  type CreateDuesTypeInput,
  type DuesTypeListResponse,
  type DuesTypeMutationResponse,
  type GenerateInvoicesInput,
  type GenerateInvoicesResponse,
  type InvoiceDetailResponse,
  type InvoiceListResponse,
  type InvoiceMutationResponse,
  type InvoiceStatus,
  type WaiveInvoiceInput,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (status?: InvoiceStatus) => ["invoices", "list", status ?? "all"] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

export const duesTypeKeys = {
  all: ["dues-types"] as const,
};

export function listDuesTypes(): Promise<DuesTypeListResponse> {
  return apiRequest("/dues-types", duesTypeListResponseSchema);
}

export function createDuesType(input: CreateDuesTypeInput): Promise<DuesTypeMutationResponse> {
  return apiRequest("/dues-types", duesTypeMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function generateInvoices(
  input: GenerateInvoicesInput,
): Promise<GenerateInvoicesResponse> {
  return apiRequest("/invoices/generate", generateInvoicesResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function listInvoices(status?: InvoiceStatus, limit = 20): Promise<InvoiceListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status) query.set("status", status);
  return apiRequest(`/invoices?${query.toString()}`, invoiceListResponseSchema);
}

export function getInvoice(id: string): Promise<InvoiceDetailResponse> {
  return apiRequest(`/invoices/${encodeURIComponent(id)}`, invoiceDetailResponseSchema);
}

export function waiveInvoice(
  id: string,
  input: WaiveInvoiceInput,
): Promise<InvoiceMutationResponse> {
  return apiRequest(`/invoices/${encodeURIComponent(id)}/waive`, invoiceMutationResponseSchema, {
    method: "POST",
    body: input,
  });
}
