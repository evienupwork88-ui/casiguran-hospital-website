import multer from "multer";
import { Router } from "express";
import { addAdminPharmacyImages, getAdminPharmacy, removeAdminPharmacyImage, updateAdminPharmacy, uploadAdminPharmacyOrganizationalChart } from "../../controllers/pharmacy.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updatePharmacySchema } from "../../validation/pharmacy.schema";

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
router.get("/", asyncHandler(getAdminPharmacy));
router.put("/", requireCsrf, validateBody(updatePharmacySchema), requireChangeApproval("Pharmacy", "Update"), asyncHandler(updateAdminPharmacy));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Pharmacy", "Add images"), asyncHandler(addAdminPharmacyImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Pharmacy", "Remove image"), asyncHandler(removeAdminPharmacyImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Pharmacy", "Update organizational chart"), asyncHandler(uploadAdminPharmacyOrganizationalChart));

export default router;
