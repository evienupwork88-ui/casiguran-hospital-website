import multer from "multer";
import { Router } from "express";
import { addAdminHimdImages, getAdminHimd, getAdminHimdSlideshow, removeAdminHimdImage, updateAdminHimd, uploadAdminHimdOrganizationalChart } from "../../controllers/himd.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateHimdContentSchema } from "../../validation/himd.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.maxUploadImageBytes } });
const uploadOrgChart = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.maxOrgChartImageBytes } });

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/slideshow", asyncHandler(getAdminHimdSlideshow));
router.post("/images", requireCsrf, upload.array("images", 30), requireChangeApproval("HIMD", "Add images"), asyncHandler(addAdminHimdImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("HIMD", "Remove image"), asyncHandler(removeAdminHimdImage));
router.get("/:section", asyncHandler(getAdminHimd));
router.put("/:section", requireCsrf, validateBody(updateHimdContentSchema), requireChangeApproval("HIMD", "Update"), asyncHandler(updateAdminHimd));
router.put("/:section/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("HIMD", "Update organizational chart"), asyncHandler(uploadAdminHimdOrganizationalChart));

export default router;
