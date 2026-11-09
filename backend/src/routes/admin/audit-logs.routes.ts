import { Router } from "express";
import { exportAdminAuditLogs, getAdminAuditMonthlyStats, listAdminAuditLogs } from "../../controllers/audit-logs.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/stats", asyncHandler(getAdminAuditMonthlyStats));
router.get("/export", asyncHandler(exportAdminAuditLogs));
router.get("/", asyncHandler(listAdminAuditLogs));

export default router;
