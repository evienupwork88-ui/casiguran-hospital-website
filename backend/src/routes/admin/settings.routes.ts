import { Router } from "express";
import { listAdminSettings, updateAdminSettings } from "../../controllers/settings.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateSettingsSchema } from "../../validation/settings.schema";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(listAdminSettings));
router.put("/", requireCsrf, validateBody(updateSettingsSchema), requireChangeApproval("Site settings", "Update"), asyncHandler(updateAdminSettings));

export default router;
