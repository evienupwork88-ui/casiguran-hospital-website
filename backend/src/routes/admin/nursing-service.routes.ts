import multer from "multer";
import { Router } from "express";
import { addAdminNursingServiceImages, getAdminNursingService, removeAdminNursingServiceImage, updateAdminNursingService, uploadAdminNursingServiceOrganizationalChart } from "../../controllers/nursing-service.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateNursingServiceSchema } from "../../validation/nursing-service.schema";

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
router.get("/", asyncHandler(getAdminNursingService));
router.put("/", requireCsrf, validateBody(updateNursingServiceSchema), requireChangeApproval("Nursing Service", "Update"), asyncHandler(updateAdminNursingService));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Nursing Service", "Add images"), asyncHandler(addAdminNursingServiceImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Nursing Service", "Remove image"), asyncHandler(removeAdminNursingServiceImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Nursing Service", "Update organizational chart"), asyncHandler(uploadAdminNursingServiceOrganizationalChart));

export default router;
