import express from "express";
import cors from "cors";
import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsAllowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());

  // Mounted directly for now — a central routes/index.ts aggregator will
  // take over once more than one domain exists (see docs/blueprint.md).
  app.use("/api/health", healthRoutes);

  return app;
}
