import { Router } from "express";
import { createAdminNews, deleteAdminNews, listAdminNews, updateAdminNews } from "../../controllers/news.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createNewsSchema, updateNewsSchema } from "../../validation/news.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminNews));
router.post("/", requireCsrf, validateBody(createNewsSchema), requireChangeApproval("News", "Create"), asyncHandler(createAdminNews));
router.put("/:id", requireCsrf, validateBody(updateNewsSchema), requireChangeApproval("News", "Update"), asyncHandler(updateAdminNews));
router.delete("/:id", requireRole("admin", "editor"), requireCsrf, requireChangeApproval("News", "Delete"), asyncHandler(deleteAdminNews));

export default router;
