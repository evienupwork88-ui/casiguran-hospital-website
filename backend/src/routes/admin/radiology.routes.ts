import multer from "multer";
import { Router } from "express";
import { addAdminRadiologyImages, getAdminRadiology, removeAdminRadiologyImage, updateAdminRadiology, uploadAdminRadiologyOrganizationalChart } from "../../controllers/radiology.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateRadiologySchema } from "../../validation/radiology.schema";

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
router.get("/", asyncHandler(getAdminRadiology));
router.put("/", requireCsrf, validateBody(updateRadiologySchema), requireChangeApproval("Radiology", "Update"), asyncHandler(updateAdminRadiology));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Radiology", "Add images"), asyncHandler(addAdminRadiologyImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Radiology", "Remove image"), asyncHandler(removeAdminRadiologyImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Radiology", "Update organizational chart"), asyncHandler(uploadAdminRadiologyOrganizationalChart));

export default router;
