import multer from "multer";
import { Router } from "express";
import { addAdminPathologyAndLaboratoriesImages, getAdminPathologyAndLaboratories, removeAdminPathologyAndLaboratoriesImage, updateAdminPathologyAndLaboratories, uploadAdminPathologyAndLaboratoriesOrganizationalChart } from "../../controllers/pathology-laboratories.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updatePathologyAndLaboratoriesSchema } from "../../validation/pathology-laboratories.schema";

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
router.get("/", asyncHandler(getAdminPathologyAndLaboratories));
router.put("/", requireCsrf, validateBody(updatePathologyAndLaboratoriesSchema), requireChangeApproval("Pathology and Laboratories", "Update"), asyncHandler(updateAdminPathologyAndLaboratories));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Pathology and Laboratories", "Add images"), asyncHandler(addAdminPathologyAndLaboratoriesImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Pathology and Laboratories", "Remove image"), asyncHandler(removeAdminPathologyAndLaboratoriesImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Pathology and Laboratories", "Update organizational chart"), asyncHandler(uploadAdminPathologyAndLaboratoriesOrganizationalChart));

export default router;
