import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AppConfig } from "../lib/env";
import { responseMeta } from "../lib/http";

const querySchema = z.object({
  /** The `versionCode` the caller is currently running, so the server can
   * answer "nothing newer" rather than making every client compare. */
  versionCode: z.coerce.number().int().min(0).optional(),
});

/**
 * Tells the installed Android app whether a newer APK exists.
 *
 * Deliberately unauthenticated: a warga whose app is too old to sign in must
 * still be able to discover the update. Nothing here is sensitive — a version
 * number and a public download URL.
 */
export async function registerAppReleaseRoutes(app: FastifyInstance, config: AppConfig) {
  app.get("/api/v1/app/latest-release", async (request) => {
    const query = querySchema.parse(request.query);

    const versionCode = config.MOBILE_LATEST_VERSION_CODE ?? null;
    const apkUrl = config.MOBILE_APK_URL ?? null;
    // Without both a version and somewhere to download it from there is
    // nothing to offer, so the app is told to stay put.
    const configured = versionCode !== null && apkUrl !== null;
    const available =
      configured && (query.versionCode === undefined || versionCode > query.versionCode);

    return {
      data: {
        release: {
          available,
          versionCode: configured ? versionCode : null,
          versionName: configured ? (config.MOBILE_LATEST_VERSION_NAME ?? null) : null,
          apkUrl: configured ? apkUrl : null,
          releaseNotes: configured ? (config.MOBILE_RELEASE_NOTES ?? null) : null,
          mandatory: configured ? config.MOBILE_UPDATE_MANDATORY : false,
        },
      },
      meta: responseMeta(request),
    };
  });
}
