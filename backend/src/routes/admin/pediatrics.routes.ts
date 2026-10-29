import multer from "multer";
import { Router } from "express";
import { addAdminPediatricsImages, getAdminPediatrics, removeAdminPediatricsImage, updateAdminPediatrics, uploadAdminPediatricsOrganizationalChart } from "../../controllers/pediatrics.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updatePediatricsSchema } from "../../validation/pediatrics.schema";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadImageBytes },
});
const uploadOrgChart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxOrgChartImageBytes },
});

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(getAdminPediatrics));
router.put("/", requireCsrf, validateBody(updatePediatricsSchema), requireChangeApproval("Pediatrics", "Update"), asyncHandler(updateAdminPediatrics));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Pediatrics", "Add images"), asyncHandler(addAdminPediatricsImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Pediatrics", "Remove image"), asyncHandler(removeAdminPediatricsImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Pediatrics", "Update organizational chart"), asyncHandler(uploadAdminPediatricsOrganizationalChart));

export default router;
