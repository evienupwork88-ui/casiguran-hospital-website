import { Router } from "express";
import { createAdminNews, listAdminNews } from "../../controllers/news.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createNewsSchema } from "../../validation/news.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminNews));
router.post("/", validateBody(createNewsSchema), asyncHandler(createAdminNews));

export default router;
