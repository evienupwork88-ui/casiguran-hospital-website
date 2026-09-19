import { Router } from "express";
import { createAdminService, listAdminServices } from "../../controllers/services.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createServiceSchema } from "../../validation/services.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminServices));
router.post("/", validateBody(createServiceSchema), asyncHandler(createAdminService));

export default router;
