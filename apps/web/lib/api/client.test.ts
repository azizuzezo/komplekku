import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, apiRequest } from "./client";

const testSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  meta: z.object({}),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("sends cookie credentials and validates a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true }, meta: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/health", testSchema)).resolves.toEqual({
      data: { ok: true },
      meta: {},
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/health",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("preserves the API error code and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Akses ditolak." } }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const error = await apiRequest("/protected", testSchema).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "FORBIDDEN", status: 403, message: "Akses ditolak." });
  });

  it("sends an object body as a single JSON-encoded object, not a stringified string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true }, meta: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/health", testSchema, {
      method: "POST",
      body: { title: "hello" },
    });

    const sentBody = fetchMock.mock.calls[0][1].body;
    expect(JSON.parse(sentBody)).toEqual({ title: "hello" });
  });

  it("classifies a failed fetch as offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await apiRequest("/health", testSchema).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "NETWORK_UNAVAILABLE", status: 0, offline: true });
  });
});
