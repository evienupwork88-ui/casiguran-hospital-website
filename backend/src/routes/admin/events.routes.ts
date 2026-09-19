import { Router } from "express";
import { createAdminEvent, listAdminEvents } from "../../controllers/events.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createEventSchema } from "../../validation/events.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminEvents));
router.post("/", validateBody(createEventSchema), asyncHandler(createAdminEvent));

export default router;
