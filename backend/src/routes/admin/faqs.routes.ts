import { Router } from "express";
import { archiveAdminFaq, createAdminFaq, listAdminFaqs, updateAdminFaq } from "../../controllers/faqs.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createFaqSchema, updateFaqSchema } from "../../validation/faqs.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminFaqs));
router.post("/", requireCsrf, validateBody(createFaqSchema), requireChangeApproval("FAQs", "Create"), asyncHandler(createAdminFaq));
router.put("/:id", requireCsrf, validateBody(updateFaqSchema), requireChangeApproval("FAQs", "Update"), asyncHandler(updateAdminFaq));
router.patch("/:id/archive", requireCsrf, requireChangeApproval("FAQs", "Archive"), asyncHandler(archiveAdminFaq));

export default router;
