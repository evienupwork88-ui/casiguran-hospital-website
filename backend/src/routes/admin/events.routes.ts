import { Router } from "express";
import { createAdminEvent, deleteAdminEvent, listAdminEvents, updateAdminEvent } from "../../controllers/events.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createEventSchema, updateEventSchema } from "../../validation/events.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminEvents));
router.post("/", requireCsrf, validateBody(createEventSchema), asyncHandler(createAdminEvent));
router.put("/:id", requireCsrf, validateBody(updateEventSchema), asyncHandler(updateAdminEvent));
router.delete("/:id", requireRole("admin"), requireCsrf, asyncHandler(deleteAdminEvent));

export default router;
