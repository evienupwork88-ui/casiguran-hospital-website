import { Router } from "express";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncements,
  updateAdminAnnouncement,
} from "../../controllers/announcements.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAnnouncementSchema, updateAnnouncementSchema } from "../../validation/announcements.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminAnnouncements));
router.post("/", requireCsrf, validateBody(createAnnouncementSchema), asyncHandler(createAdminAnnouncement));
router.put("/:id", requireCsrf, validateBody(updateAnnouncementSchema), asyncHandler(updateAdminAnnouncement));
router.delete("/:id", requireRole("admin"), requireCsrf, asyncHandler(deleteAdminAnnouncement));

export default router;
