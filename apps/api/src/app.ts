import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";

import type { AppRepository } from "./domain/repository";
import { createAuthenticate } from "./lib/authentication";
import { loadConfig, type AppConfig } from "./lib/env";
import { registerErrorHandler } from "./lib/errors";
import { PrismaRepository } from "./repositories/prisma-repository";
import { registerAgendaRoutes } from "./routes/agenda";
import { registerAnnouncementRoutes } from "./routes/announcements";
import { registerAuthRoutes } from "./routes/auth";
import { registerCameraRoutes } from "./routes/cameras";
import { registerCashRoutes } from "./routes/cash";
import { registerDuesRoutes } from "./routes/dues";
import { registerEmergencyRoutes } from "./routes/emergencies";
import { registerFacilityRoutes } from "./routes/facilities";
import { registerFinanceDashboardRoutes } from "./routes/finance-dashboard";
import { registerHealthRoutes } from "./routes/health";
import { registerHouseRoutes } from "./routes/houses";
import { registerIncidentRoutes } from "./routes/incidents";
import { registerLetterRoutes } from "./routes/letters";
import { registerOnboardingRoutes } from "./routes/onboarding";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerPackageRoutes } from "./routes/packages";
import { registerPatrolRoutes } from "./routes/patrol";
import { registerPaymentRoutes } from "./routes/payments";
import { registerReportRoutes } from "./routes/reports";
import { registerResidentRoutes } from "./routes/resident";
import { registerSecurityDashboardRoutes } from "./routes/security-dashboard";
import { registerSecurityShiftRoutes } from "./routes/security-shifts";
import { registerVisitorRoutes } from "./routes/visitors";

export interface BuildAppOptions {
  env?: Record<string, string | boolean | number | undefined>;
  repository?: AppRepository;
  logger?: boolean;
}

export interface BuiltApp {
  app: FastifyInstance;
  config: AppConfig;
  repository: AppRepository;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<BuiltApp> {
  const config = loadConfig(options.env ?? process.env);
  const repository = options.repository ?? new PrismaRepository();
  const app = Fastify({
    logger: options.logger === false ? false : { level: config.LOG_LEVEL },
    trustProxy: false,
  });

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    errorResponseBuilder: () => ({
      error: {
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
      },
    }),
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Komplekku API",
        description: "API lokal Komplekku untuk web dan aplikasi mobile.",
        version: "0.1.0",
      },
      servers: [{ url: "http://localhost:3001" }],
    },
  });
  if (config.APP_ENV === "local") {
    await app.register(swaggerUi, { routePrefix: "/documentation" });
  }

  registerErrorHandler(app);
  const authenticate = createAuthenticate(repository, config);
  await registerHealthRoutes(app, repository);
  await registerAuthRoutes(app, repository, config, authenticate);
  await registerResidentRoutes(app, repository, authenticate);
  await registerAnnouncementRoutes(app, repository, authenticate);
  await registerAgendaRoutes(app, repository, authenticate);
  await registerNotificationRoutes(app, repository, authenticate);
  await registerOnboardingRoutes(app, repository, authenticate);
  await registerCameraRoutes(app, repository, authenticate);
  await registerEmergencyRoutes(app, repository, authenticate);
  await registerVisitorRoutes(app, repository, authenticate);
  await registerPackageRoutes(app, repository, authenticate);
  await registerSecurityShiftRoutes(app, repository, authenticate);
  await registerPatrolRoutes(app, repository, authenticate);
  await registerIncidentRoutes(app, repository, authenticate);
  await registerSecurityDashboardRoutes(app, repository, authenticate);
  await registerReportRoutes(app, repository, authenticate);
  await registerLetterRoutes(app, repository, authenticate);
  await registerFacilityRoutes(app, repository, authenticate);
  await registerDuesRoutes(app, repository, authenticate);
  await registerPaymentRoutes(app, repository, authenticate);
  await registerCashRoutes(app, repository, authenticate);
  await registerFinanceDashboardRoutes(app, repository, authenticate);
  await registerHouseRoutes(app, repository, authenticate);

  app.addHook("onClose", async () => repository.close());
  return { app, config, repository };
}
