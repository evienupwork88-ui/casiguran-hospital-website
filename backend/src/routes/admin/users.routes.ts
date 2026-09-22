import { Router } from "express";
import { createAdminUser, deactivateAdminUser, listAdminUsers, updateAdminUser } from "../../controllers/users.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createUserSchema, updateUserSchema } from "../../validation/users.schema";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(listAdminUsers));
router.post("/", requireCsrf, validateBody(createUserSchema), asyncHandler(createAdminUser));
router.put("/:id", requireCsrf, validateBody(updateUserSchema), asyncHandler(updateAdminUser));
router.delete("/:id", requireCsrf, asyncHandler(deactivateAdminUser));

export default router;
