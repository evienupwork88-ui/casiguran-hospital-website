import { Router } from "express";
import { createAdminNews, deleteAdminNews, listAdminNews, updateAdminNews } from "../../controllers/news.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createNewsSchema, updateNewsSchema } from "../../validation/news.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminNews));
router.post("/", requireCsrf, validateBody(createNewsSchema), asyncHandler(createAdminNews));
router.put("/:id", requireCsrf, validateBody(updateNewsSchema), asyncHandler(updateAdminNews));
router.delete("/:id", requireRole("admin"), requireCsrf, asyncHandler(deleteAdminNews));

export default router;
