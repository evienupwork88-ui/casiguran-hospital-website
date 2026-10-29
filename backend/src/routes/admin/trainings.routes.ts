import multer from "multer";
import { Router } from "express";
import { createAdminTraining, deleteAdminTraining, listAdminTrainingItems, updateAdminTraining } from "../../controllers/trainings.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { trainingSchema, updateTrainingSchema } from "../../validation/trainings.schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadImageBytes },
});
const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminTrainingItems));
router.post("/", requireCsrf, upload.single("image"), validateBody(trainingSchema), requireChangeApproval("Trainings", "Create"), asyncHandler(createAdminTraining));
router.put("/:id", requireCsrf, upload.single("image"), validateBody(updateTrainingSchema), requireChangeApproval("Trainings", "Update"), asyncHandler(updateAdminTraining));
router.delete("/:id", requireRole("admin", "editor"), requireCsrf, requireChangeApproval("Trainings", "Delete"), asyncHandler(deleteAdminTraining));

export default router;
