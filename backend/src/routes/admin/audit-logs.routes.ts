import { Router } from "express";
import { listAdminAuditLogs } from "../../controllers/audit-logs.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(listAdminAuditLogs));

export default router;
