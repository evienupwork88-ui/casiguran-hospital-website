import multer from "multer";
import { Router } from "express";
import { addAdminOpdImages, getAdminOpd, removeAdminOpdImage, updateAdminOpd, uploadAdminOpdOrganizationalChart } from "../../controllers/opd.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateOpdSchema } from "../../validation/opd.schema";

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
router.get("/", asyncHandler(getAdminOpd));
router.put("/", requireCsrf, validateBody(updateOpdSchema), requireChangeApproval("OPD", "Update"), asyncHandler(updateAdminOpd));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("OPD", "Add images"), asyncHandler(addAdminOpdImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("OPD", "Remove image"), asyncHandler(removeAdminOpdImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("OPD", "Update organizational chart"), asyncHandler(uploadAdminOpdOrganizationalChart));

export default router;
