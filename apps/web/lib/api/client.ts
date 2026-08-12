import { apiErrorResponseSchema } from "@komplekku/contracts";
import type { ZodType } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:3001/api/v1";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly offline: boolean;

  constructor(message: string, options: { code: string; status: number; offline?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.offline = options.offline ?? false;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("Respons server tidak dapat dibaca.", {
      code: "INVALID_RESPONSE",
      status: response.status,
    });
  }
}

async function request(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      body,
      cache: "no-store",
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.", {
      code: "NETWORK_UNAVAILABLE",
      status: 0,
      offline: true,
    });
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(payload);
    if (parsedError.success) {
      throw new ApiError(parsedError.data.error.message, {
        code: parsedError.data.error.code,
        status: response.status,
      });
    }

    throw new ApiError("Permintaan belum dapat diproses.", {
      code: "REQUEST_FAILED",
      status: response.status,
    });
  }

  return payload;
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const payload = await request(path, options);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError("Format data dari server tidak sesuai.", {
      code: "INVALID_RESPONSE",
      status: 502,
    });
  }

  return parsed.data;
}

export function getRequestState(
  error: unknown,
): "offline" | "unauthorized" | "forbidden" | "error" {
  if (error instanceof ApiError) {
    if (error.offline) return "offline";
    if (error.status === 401) return "unauthorized";
    if (error.status === 403) return "forbidden";
  }

  return "error";
}
