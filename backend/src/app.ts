import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";

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

  // Must be registered LAST — Express only treats a 4-arg middleware as
  // an error handler, and only errors from routes mounted before this
  // point reach it.
  app.use(errorHandler);

  return app;
}
