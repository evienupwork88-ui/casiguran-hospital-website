import { Router } from "express";
import {
  createAdminAnnouncement,
  listAdminAnnouncements,
} from "../../controllers/announcements.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAnnouncementSchema } from "../../validation/announcements.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminAnnouncements));
router.post("/", validateBody(createAnnouncementSchema), asyncHandler(createAdminAnnouncement));

export default router;
