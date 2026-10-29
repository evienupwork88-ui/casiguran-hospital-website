import { Router } from "express";
import { getAdminContactMessageNotifications, listAdminContactMessageAssignees, listAdminContactMessages, markAdminContactMessageRead, updateAdminContactMessage } from "../../controllers/contact-messages.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateContactMessageSchema } from "../../validation/contact-messages.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/notifications", asyncHandler(getAdminContactMessageNotifications));
router.get("/assignees", asyncHandler(listAdminContactMessageAssignees));
router.get("/", asyncHandler(listAdminContactMessages));
router.patch("/:id/read", requireCsrf, asyncHandler(markAdminContactMessageRead));
router.put("/:id", requireCsrf, validateBody(updateContactMessageSchema), asyncHandler(updateAdminContactMessage));

export default router;
