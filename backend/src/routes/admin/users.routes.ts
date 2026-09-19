import { Router } from "express";
import { createAdminUser, deactivateAdminUser, listAdminUsers, updateAdminUser } from "../../controllers/users.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createUserSchema, updateUserSchema } from "../../validation/users.schema";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(listAdminUsers));
router.post("/", validateBody(createUserSchema), asyncHandler(createAdminUser));
router.put("/:id", validateBody(updateUserSchema), asyncHandler(updateAdminUser));
router.delete("/:id", asyncHandler(deactivateAdminUser));

export default router;
