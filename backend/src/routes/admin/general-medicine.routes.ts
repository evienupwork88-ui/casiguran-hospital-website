import multer from "multer";
import { Router } from "express";
import { addAdminGeneralMedicineImages, getAdminGeneralMedicine, removeAdminGeneralMedicineImage, updateAdminGeneralMedicine, uploadAdminGeneralMedicineOrganizationalChart } from "../../controllers/general-medicine.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateGeneralMedicineSchema } from "../../validation/general-medicine.schema";

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
router.get("/", asyncHandler(getAdminGeneralMedicine));
router.put("/", requireCsrf, validateBody(updateGeneralMedicineSchema), requireChangeApproval("General Medicine", "Update"), asyncHandler(updateAdminGeneralMedicine));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("General Medicine", "Add images"), asyncHandler(addAdminGeneralMedicineImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("General Medicine", "Remove image"), asyncHandler(removeAdminGeneralMedicineImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("General Medicine", "Update organizational chart"), asyncHandler(uploadAdminGeneralMedicineOrganizationalChart));

export default router;
