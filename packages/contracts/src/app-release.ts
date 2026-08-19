import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

/**
 * What the installed Android app needs to decide whether to offer an update.
 *
 * `versionCode` is Android's monotonically increasing integer (the `+N` in
 * pubspec's `version:`), which is what the OS itself compares — comparing the
 * human-readable `versionName` would break on `0.9.0` vs `0.10.0`.
 */
export const appReleaseSchema = z.object({
  available: z.boolean(),
  versionCode: z.number().int().min(1).nullable(),
  versionName: z.string().nullable(),
  apkUrl: z.string().url().nullable(),
  releaseNotes: z.string().nullable(),
  /** When true the app should keep asking rather than allow "Nanti". */
  mandatory: z.boolean(),
});

export type AppRelease = z.infer<typeof appReleaseSchema>;

export const appReleaseResponseSchema = dataEnvelopeSchema(z.object({ release: appReleaseSchema }));

export type AppReleaseResponse = z.infer<typeof appReleaseResponseSchema>;
