import multer from "multer";
import { Router } from "express";
import {
  addAdminHospitalHistoryCoverImages,
  listAdminPages,
  removeAdminHospitalHistoryCoverImage,
  updateAdminHospitalHistoryCover,
  updateAdminPage,
} from "../../controllers/pages.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updatePageSchema } from "../../validation/pages.schema";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadImageBytes },
});

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminPages));
router.put("/hospital-history/cover-image", requireCsrf, upload.single("coverImage"), requireChangeApproval("Hospital History", "Update cover image"), asyncHandler(updateAdminHospitalHistoryCover));
router.post("/hospital-history/cover-images", requireCsrf, upload.array("images", 10), requireChangeApproval("Hospital History", "Add cover images"), asyncHandler(addAdminHospitalHistoryCoverImages));
router.delete("/hospital-history/cover-images/:index", requireCsrf, requireChangeApproval("Hospital History", "Remove cover image"), asyncHandler(removeAdminHospitalHistoryCoverImage));
router.put("/:slug", requireCsrf, validateBody(updatePageSchema), requireChangeApproval("Public pages", "Update"), asyncHandler(updateAdminPage));

export default router;
