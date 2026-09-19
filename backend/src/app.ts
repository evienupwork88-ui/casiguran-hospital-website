import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import publicNewsRoutes from "./routes/public/news.routes";
import publicAnnouncementsRoutes from "./routes/public/announcements.routes";
import publicEventsRoutes from "./routes/public/events.routes";
import publicPagesRoutes from "./routes/public/pages.routes";
import publicServicesRoutes from "./routes/public/services.routes";
import publicDocumentsRoutes from "./routes/public/documents.routes";
import publicSettingsRoutes from "./routes/public/settings.routes";
import adminNewsRoutes from "./routes/admin/news.routes";
import adminAnnouncementsRoutes from "./routes/admin/announcements.routes";
import adminEventsRoutes from "./routes/admin/events.routes";
import adminPagesRoutes from "./routes/admin/pages.routes";
import adminServicesRoutes from "./routes/admin/services.routes";
import adminDocumentsRoutes from "./routes/admin/documents.routes";
import adminSettingsRoutes from "./routes/admin/settings.routes";
import adminUsersRoutes from "./routes/admin/users.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsAllowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Light, general-purpose limiter across the whole API — the login
  // route additionally has its own much stricter limiter (see
  // middleware/rateLimit.ts and routes/auth.routes.ts).
  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Mounted directly for now — a central routes/index.ts aggregator will
  // take over once more than one domain exists (see docs/blueprint.md).
  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/public/news", publicNewsRoutes);
  app.use("/api/public/announcements", publicAnnouncementsRoutes);
  app.use("/api/public/events", publicEventsRoutes);
  app.use("/api/public/pages", publicPagesRoutes);
  app.use("/api/public/services", publicServicesRoutes);
  app.use("/api/public/documents", publicDocumentsRoutes);
  app.use("/api/public/settings", publicSettingsRoutes);
  app.use("/api/admin/news", adminNewsRoutes);
  app.use("/api/admin/announcements", adminAnnouncementsRoutes);
  app.use("/api/admin/events", adminEventsRoutes);
  app.use("/api/admin/pages", adminPagesRoutes);
  app.use("/api/admin/services", adminServicesRoutes);
  app.use("/api/admin/documents", adminDocumentsRoutes);
  app.use("/api/admin/settings", adminSettingsRoutes);
  app.use("/api/admin/users", adminUsersRoutes);

  // Must be registered LAST — Express only treats a 4-arg middleware as
  // an error handler, and only errors from routes mounted before this
  // point reach it.
  app.use(errorHandler);

  return app;
}
