import multer from "multer";
import { Router } from "express";
import { addAdminFamilyCommunityMedicineImages, getAdminFamilyCommunityMedicine, removeAdminFamilyCommunityMedicineImage, updateAdminFamilyCommunityMedicine, uploadAdminFamilyCommunityMedicineOrganizationalChart } from "../../controllers/family-community-medicine.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateFamilyCommunityMedicineSchema } from "../../validation/family-community-medicine.schema";

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
router.get("/", asyncHandler(getAdminFamilyCommunityMedicine));
router.put("/", requireCsrf, validateBody(updateFamilyCommunityMedicineSchema), requireChangeApproval("Family & Community Medicine", "Update"), asyncHandler(updateAdminFamilyCommunityMedicine));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Family & Community Medicine", "Add images"), asyncHandler(addAdminFamilyCommunityMedicineImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Family & Community Medicine", "Remove image"), asyncHandler(removeAdminFamilyCommunityMedicineImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Family & Community Medicine", "Update organizational chart"), asyncHandler(uploadAdminFamilyCommunityMedicineOrganizationalChart));

export default router;
