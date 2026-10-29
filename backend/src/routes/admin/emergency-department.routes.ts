import multer from "multer";
import { Router } from "express";
import {
  addAdminEmergencyDepartmentImages,
  getAdminEmergencyDepartment,
  removeAdminEmergencyDepartmentImage,
  updateAdminEmergencyDepartment,
  uploadAdminEmergencyDepartmentChart,
} from "../../controllers/emergency-department.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateEmergencyDepartmentSchema } from "../../validation/emergency-department.schema";

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
router.get("/", asyncHandler(getAdminEmergencyDepartment));
router.put("/", requireCsrf, validateBody(updateEmergencyDepartmentSchema), requireChangeApproval("Emergency Department", "Update"), asyncHandler(updateAdminEmergencyDepartment));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Emergency Department", "Add images"), asyncHandler(addAdminEmergencyDepartmentImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Emergency Department", "Remove image"), asyncHandler(removeAdminEmergencyDepartmentImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Emergency Department", "Update organizational chart"), asyncHandler(uploadAdminEmergencyDepartmentChart));

export default router;
