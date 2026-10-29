import multer from "multer";
import { Router } from "express";
import { addAdminDentalImages, getAdminDental, removeAdminDentalImage, updateAdminDental, uploadAdminDentalOrganizationalChart } from "../../controllers/dental.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateDentalSchema } from "../../validation/dental.schema";

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
router.get("/", asyncHandler(getAdminDental));
router.put("/", requireCsrf, validateBody(updateDentalSchema), requireChangeApproval("Dental", "Update"), asyncHandler(updateAdminDental));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Dental", "Add images"), asyncHandler(addAdminDentalImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Dental", "Remove image"), asyncHandler(removeAdminDentalImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Dental", "Update organizational chart"), asyncHandler(uploadAdminDentalOrganizationalChart));

export default router;
