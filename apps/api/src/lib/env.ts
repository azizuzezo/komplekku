import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const envSchema = z
  .object({
    APP_ENV: z.enum(["local", "test", "production"]).default("local"),
    HOST: z.string().default("127.0.0.1"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z
      .string()
      .url()
      .default("postgresql://komplekku:komplekku@localhost:5432/komplekku"),
    WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
    AUTH_MODE: z.enum(["development", "provider"]).default("development"),
    ALLOW_DEV_OTP: booleanFromEnv.default(true),
    DEV_OTP: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
    OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),
    OTP_RESEND_SECONDS: z.coerce.number().int().min(10).max(300).default(60),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
    SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(31_536_000).default(604_800),
    SESSION_SECRET: z.string().min(32).default("komplekku-local-session-secret-change-me"),
    SESSION_COOKIE_NAME: z.string().min(1).default("komplekku_session"),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
    RATE_LIMIT_WINDOW: z.string().min(1).default("1 minute"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    WA_BOT_URL: z
      .string()
      .url()
      .default("https://wabot-production-fa77.up.railway.app"),
    WA_BOT_API_KEY: z.string().default("komplekku-x-muter"),
  })
  .superRefine((value, context) => {
    if (value.AUTH_MODE === "development") {
      if (value.APP_ENV !== "local") {
        context.addIssue({
          code: "custom",
          path: ["AUTH_MODE"],
          message: "OTP development hanya boleh digunakan saat APP_ENV=local.",
        });
      }
      if (!value.ALLOW_DEV_OTP || !value.DEV_OTP) {
        context.addIssue({
          code: "custom",
          path: ["ALLOW_DEV_OTP"],
          message: "OTP development memerlukan ALLOW_DEV_OTP=true dan DEV_OTP.",
        });
      }
    }

    if (value.AUTH_MODE === "provider") {
      if (!value.WA_BOT_URL) {
        context.addIssue({
          code: "custom",
          path: ["WA_BOT_URL"],
          message: "AUTH_MODE=provider memerlukan WA_BOT_URL.",
        });
      }
      if (!value.WA_BOT_API_KEY) {
        context.addIssue({
          code: "custom",
          path: ["WA_BOT_API_KEY"],
          message: "AUTH_MODE=provider memerlukan WA_BOT_API_KEY.",
        });
      }
    }

    if (value.APP_ENV === "production" && (value.ALLOW_DEV_OTP || value.DEV_OTP === "123456")) {
      context.addIssue({
        code: "custom",
        path: ["ALLOW_DEV_OTP"],
        message: "Konfigurasi OTP development tidak boleh aktif di production.",
      });
    }

    if (
      value.APP_ENV === "production" &&
      value.SESSION_SECRET === "komplekku-local-session-secret-change-me"
    ) {
      context.addIssue({
        code: "custom",
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET production harus menggunakan nilai rahasia sendiri.",
      });
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(
  source: Record<string, string | boolean | number | undefined> = process.env,
): AppConfig {
  const appEnv = source.APP_ENV ?? "local";
  const defaultHost = source.HOST ?? (appEnv === "local" ? "127.0.0.1" : "0.0.0.0");
  const defaultPort = source.API_PORT ?? source.PORT ?? 3001;

  return envSchema.parse({
    ...source,
    HOST: defaultHost,
    API_PORT: defaultPort,
    ...(appEnv === "local" && source.DEV_OTP === undefined ? { DEV_OTP: "123456" } : {}),
  });
}

