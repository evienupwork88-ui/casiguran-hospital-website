import { createApp } from "./app";
import { env } from "./config/env";
import { startSecurityMonitoringWorkers } from "./services/security-monitoring.service";
import { startAdminChangeRequestEmailWorker } from "./services/admin-change-request-email.service";

const app = createApp();

app.listen(env.port, () => {
  console.log(`[cdh-backend] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  startSecurityMonitoringWorkers();
  startAdminChangeRequestEmailWorker();
});
