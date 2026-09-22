import { Router } from "express";
import { createAdminService, deleteAdminService, listAdminServices, updateAdminService } from "../../controllers/services.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createServiceSchema, updateServiceSchema } from "../../validation/services.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminServices));
router.post("/", requireCsrf, validateBody(createServiceSchema), asyncHandler(createAdminService));
router.put("/:id", requireCsrf, validateBody(updateServiceSchema), asyncHandler(updateAdminService));
router.delete("/:id", requireRole("admin"), requireCsrf, asyncHandler(deleteAdminService));

export default router;
