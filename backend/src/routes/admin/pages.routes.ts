import { Router } from "express";
import { listAdminPages, updateAdminPage } from "../../controllers/pages.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updatePageSchema } from "../../validation/pages.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminPages));
router.put("/:slug", requireCsrf, validateBody(updatePageSchema), asyncHandler(updateAdminPage));

export default router;
