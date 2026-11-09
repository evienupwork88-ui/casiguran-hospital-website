import { createApp } from "./app";
import { env } from "./config/env";
import { startSecurityMonitoringWorkers } from "./services/security-monitoring.service";

const app = createApp();

app.listen(env.port, () => {
  console.log(`[cdh-backend] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  startSecurityMonitoringWorkers();
});
