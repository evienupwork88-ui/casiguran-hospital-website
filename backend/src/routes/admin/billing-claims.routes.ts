import multer from "multer";
import { Router } from "express";
import { addAdminBillingClaimsImages, getAdminBillingClaims, removeAdminBillingClaimsImage, updateAdminBillingClaims, uploadAdminBillingClaimsChart } from "../../controllers/billing-claims.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateBillingClaimsContentSchema } from "../../validation/billing-claims.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.maxUploadImageBytes } });
const uploadOrgChart = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.maxOrgChartImageBytes } });

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/:section", asyncHandler(getAdminBillingClaims));
router.put("/:section", requireCsrf, validateBody(updateBillingClaimsContentSchema), requireChangeApproval("Billing & Claims", "Update"), asyncHandler(updateAdminBillingClaims));
router.post("/:section/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Billing & Claims", "Add images"), asyncHandler(addAdminBillingClaimsImages));
router.delete("/:section/images/:index", requireCsrf, requireChangeApproval("Billing & Claims", "Remove image"), asyncHandler(removeAdminBillingClaimsImage));
router.put("/:section/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Billing & Claims", "Update organizational chart"), asyncHandler(uploadAdminBillingClaimsChart));

export default router;
