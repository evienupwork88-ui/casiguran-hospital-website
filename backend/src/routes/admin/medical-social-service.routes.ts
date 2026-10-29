import multer from "multer";
import { Router } from "express";
import { addAdminMedicalSocialServiceImages, getAdminMedicalSocialService, removeAdminMedicalSocialServiceImage, updateAdminMedicalSocialService, uploadAdminMedicalSocialServiceOrganizationalChart } from "../../controllers/medical-social-service.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateMedicalSocialServiceSchema } from "../../validation/medical-social-service.schema";

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
router.get("/", asyncHandler(getAdminMedicalSocialService));
router.put("/", requireCsrf, validateBody(updateMedicalSocialServiceSchema), requireChangeApproval("Medical Social Service", "Update"), asyncHandler(updateAdminMedicalSocialService));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Medical Social Service", "Add images"), asyncHandler(addAdminMedicalSocialServiceImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Medical Social Service", "Remove image"), asyncHandler(removeAdminMedicalSocialServiceImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Medical Social Service", "Update organizational chart"), asyncHandler(uploadAdminMedicalSocialServiceOrganizationalChart));

export default router;
