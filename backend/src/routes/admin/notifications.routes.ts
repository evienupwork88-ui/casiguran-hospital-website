import { Router } from "express";
import { getAdminNotifications } from "../../controllers/admin-notifications.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(getAdminNotifications));

export default router;
