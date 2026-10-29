import multer from "multer";
import { Router } from "express";
import { addAdminObstetricsAndGynecologyImages, getAdminObstetricsAndGynecology, removeAdminObstetricsAndGynecologyImage, updateAdminObstetricsAndGynecology, uploadAdminObstetricsAndGynecologyOrganizationalChart } from "../../controllers/obstetrics-and-gynecology.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateObstetricsAndGynecologySchema } from "../../validation/obstetrics-and-gynecology.schema";

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
router.get("/", asyncHandler(getAdminObstetricsAndGynecology));
router.put("/", requireCsrf, validateBody(updateObstetricsAndGynecologySchema), requireChangeApproval("Obstetrics and Gynecology", "Update"), asyncHandler(updateAdminObstetricsAndGynecology));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Obstetrics and Gynecology", "Add images"), asyncHandler(addAdminObstetricsAndGynecologyImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Obstetrics and Gynecology", "Remove image"), asyncHandler(removeAdminObstetricsAndGynecologyImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Obstetrics and Gynecology", "Update organizational chart"), asyncHandler(uploadAdminObstetricsAndGynecologyOrganizationalChart));

export default router;
