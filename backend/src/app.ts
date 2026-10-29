import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { auditRequest } from "./middleware/auditRequest";
import healthRoutes from "./routes/health.routes";
import timeRoutes from "./routes/time.routes";
import authRoutes from "./routes/auth.routes";
import publicNewsRoutes from "./routes/public/news.routes";
import publicAnnouncementsRoutes from "./routes/public/announcements.routes";
import publicEventsRoutes from "./routes/public/events.routes";
import publicPagesRoutes from "./routes/public/pages.routes";
import publicDocumentsRoutes from "./routes/public/documents.routes";
import publicKeyOfficialsRoutes from "./routes/public/key-officials.routes";
import publicSettingsRoutes from "./routes/public/settings.routes";
import publicTrainingsRoutes from "./routes/public/trainings.routes";
import publicContactMessagesRoutes from "./routes/public/contact-messages.routes";
import publicFaqRoutes from "./routes/public/faqs.routes";
import publicRateFeesRoutes from "./routes/public/rate-fees.routes";
import publicOpdRoutes from "./routes/public/opd.routes";
import publicRadiologyRoutes from "./routes/public/radiology.routes";
import publicGeneralMedicineRoutes from "./routes/public/general-medicine.routes";
import publicObstetricsAndGynecologyRoutes from "./routes/public/obstetrics-and-gynecology.routes";
import publicPediatricsRoutes from "./routes/public/pediatrics.routes";
import publicDentalRoutes from "./routes/public/dental.routes";
import publicFamilyCommunityMedicineRoutes from "./routes/public/family-community-medicine.routes";
import publicMedicalSocialServiceRoutes from "./routes/public/medical-social-service.routes";
import publicNutritionAndDieteticsRoutes from "./routes/public/nutrition-and-dietetics.routes";
import publicPharmacyRoutes from "./routes/public/pharmacy.routes";
import publicPathologyLaboratoriesRoutes from "./routes/public/pathology-laboratories.routes";
import publicNursingServiceRoutes from "./routes/public/nursing-service.routes";
import publicHimdRoutes from "./routes/public/himd.routes";
import publicBillingClaimsRoutes from "./routes/public/billing-claims.routes";
import publicEmergencyDepartmentRoutes from "./routes/public/emergency-department.routes";
import adminNewsRoutes from "./routes/admin/news.routes";
import adminAnnouncementsRoutes from "./routes/admin/announcements.routes";
import adminEventsRoutes from "./routes/admin/events.routes";
import adminPagesRoutes from "./routes/admin/pages.routes";
import adminDocumentsRoutes from "./routes/admin/documents.routes";
import adminSettingsRoutes from "./routes/admin/settings.routes";
import adminUsersRoutes from "./routes/admin/users.routes";
import adminKeyOfficialsRoutes from "./routes/admin/key-officials.routes";
import adminTrainingsRoutes from "./routes/admin/trainings.routes";
import adminContactMessagesRoutes from "./routes/admin/contact-messages.routes";
import adminChangeRequestsRoutes from "./routes/admin/change-requests.routes";
import adminFaqRoutes from "./routes/admin/faqs.routes";
import adminAuditLogsRoutes from "./routes/admin/audit-logs.routes";
import adminRateFeesRoutes from "./routes/admin/rate-fees.routes";
import adminOpdRoutes from "./routes/admin/opd.routes";
import adminRadiologyRoutes from "./routes/admin/radiology.routes";
import adminGeneralMedicineRoutes from "./routes/admin/general-medicine.routes";
import adminObstetricsAndGynecologyRoutes from "./routes/admin/obstetrics-and-gynecology.routes";
import adminPediatricsRoutes from "./routes/admin/pediatrics.routes";
import adminDentalRoutes from "./routes/admin/dental.routes";
import adminFamilyCommunityMedicineRoutes from "./routes/admin/family-community-medicine.routes";
import adminMedicalSocialServiceRoutes from "./routes/admin/medical-social-service.routes";
import adminNutritionAndDieteticsRoutes from "./routes/admin/nutrition-and-dietetics.routes";
import adminPharmacyRoutes from "./routes/admin/pharmacy.routes";
import adminPathologyLaboratoriesRoutes from "./routes/admin/pathology-laboratories.routes";
import adminNursingServiceRoutes from "./routes/admin/nursing-service.routes";
import adminHimdRoutes from "./routes/admin/himd.routes";
import adminBillingClaimsRoutes from "./routes/admin/billing-claims.routes";
import adminEmergencyDepartmentRoutes from "./routes/admin/emergency-department.routes";
import adminCmsBulkRoutes from "./routes/admin/cms-bulk.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.trustProxyHops);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsAllowedOrigins,
      credentials: true,
    })
  );
  app.use("/api/admin/cms-bulk", express.json({ limit: "1mb" }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(auditRequest);

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
  app.use("/api/time", timeRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/public/news", publicNewsRoutes);
  app.use("/api/public/announcements", publicAnnouncementsRoutes);
  app.use("/api/public/events", publicEventsRoutes);
  app.use("/api/public/pages", publicPagesRoutes);
  app.use("/api/public/documents", publicDocumentsRoutes);
  app.use("/api/public/key-officials", publicKeyOfficialsRoutes);
  app.use("/api/public/settings", publicSettingsRoutes);
  app.use("/api/public/trainings", publicTrainingsRoutes);
  app.use("/api/public/contact-messages", publicContactMessagesRoutes);
  app.use("/api/contact", publicContactMessagesRoutes);
  app.use("/api/faqs", publicFaqRoutes);
  app.use("/api/public/rate-fees", publicRateFeesRoutes);
  app.use("/api/public/opd", publicOpdRoutes);
  app.use("/api/public/radiology", publicRadiologyRoutes);
  app.use("/api/public/general-medicine", publicGeneralMedicineRoutes);
  app.use("/api/public/obstetrics-and-gynecology", publicObstetricsAndGynecologyRoutes);
  app.use("/api/public/pediatrics", publicPediatricsRoutes);
  app.use("/api/public/dental", publicDentalRoutes);
  app.use("/api/public/family-community-medicine", publicFamilyCommunityMedicineRoutes);
  app.use("/api/public/medical-social-service", publicMedicalSocialServiceRoutes);
  app.use("/api/public/nutrition-and-dietetics", publicNutritionAndDieteticsRoutes);
  app.use("/api/public/pharmacy", publicPharmacyRoutes);
  app.use("/api/public/pathology-laboratories", publicPathologyLaboratoriesRoutes);
  app.use("/api/public/nursing-service", publicNursingServiceRoutes);
  app.use("/api/public/himd", publicHimdRoutes);
  app.use("/api/public/billing-claims", publicBillingClaimsRoutes);
  app.use("/api/public/emergency-department", publicEmergencyDepartmentRoutes);
  app.use("/api/admin/news", adminNewsRoutes);
  app.use("/api/admin/announcements", adminAnnouncementsRoutes);
  app.use("/api/admin/events", adminEventsRoutes);
  app.use("/api/admin/pages", adminPagesRoutes);
  app.use("/api/admin/documents", adminDocumentsRoutes);
  app.use("/api/admin/settings", adminSettingsRoutes);
  app.use("/api/admin/users", adminUsersRoutes);
  app.use("/api/admin/key-officials", adminKeyOfficialsRoutes);
  app.use("/api/admin/trainings", adminTrainingsRoutes);
  app.use("/api/admin/contact-messages", adminContactMessagesRoutes);
  app.use("/api/admin/change-requests", adminChangeRequestsRoutes);
  app.use("/api/admin/faqs", adminFaqRoutes);
  app.use("/api/admin/audit-logs", adminAuditLogsRoutes);
  app.use("/api/admin/rate-fees", adminRateFeesRoutes);
  app.use("/api/admin/opd", adminOpdRoutes);
  app.use("/api/admin/radiology", adminRadiologyRoutes);
  app.use("/api/admin/general-medicine", adminGeneralMedicineRoutes);
  app.use("/api/admin/obstetrics-and-gynecology", adminObstetricsAndGynecologyRoutes);
  app.use("/api/admin/pediatrics", adminPediatricsRoutes);
  app.use("/api/admin/dental", adminDentalRoutes);
  app.use("/api/admin/family-community-medicine", adminFamilyCommunityMedicineRoutes);
  app.use("/api/admin/medical-social-service", adminMedicalSocialServiceRoutes);
  app.use("/api/admin/nutrition-and-dietetics", adminNutritionAndDieteticsRoutes);
  app.use("/api/admin/pharmacy", adminPharmacyRoutes);
  app.use("/api/admin/pathology-laboratories", adminPathologyLaboratoriesRoutes);
  app.use("/api/admin/nursing-service", adminNursingServiceRoutes);
  app.use("/api/admin/himd", adminHimdRoutes);
  app.use("/api/admin/billing-claims", adminBillingClaimsRoutes);
  app.use("/api/admin/emergency-department", adminEmergencyDepartmentRoutes);
  app.use("/api/admin/cms-bulk", adminCmsBulkRoutes);

  // Must be registered LAST — Express only treats a 4-arg middleware as
  // an error handler, and only errors from routes mounted before this
  // point reach it.
  app.use(errorHandler);

  return app;
}
