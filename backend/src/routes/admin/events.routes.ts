import { Router } from "express";
import { coverImageUpload } from "../../middleware/coverImageUpload";
import { createAdminEvent, deleteAdminEvent, listAdminEvents, updateAdminEvent } from "../../controllers/events.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createEventSchema, updateEventSchema } from "../../validation/events.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminEvents));
router.post("/", requireCsrf, coverImageUpload.single("coverImage"), validateBody(createEventSchema), requireChangeApproval("Events", "Create"), asyncHandler(createAdminEvent));
router.put("/:id", requireCsrf, coverImageUpload.single("coverImage"), validateBody(updateEventSchema), requireChangeApproval("Events", "Update"), asyncHandler(updateAdminEvent));
router.delete("/:id", requireRole("admin", "editor"), requireCsrf, requireChangeApproval("Events", "Delete"), asyncHandler(deleteAdminEvent));

export default router;
