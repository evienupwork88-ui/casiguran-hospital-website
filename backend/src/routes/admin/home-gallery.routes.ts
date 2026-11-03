import multer from "multer";
import { Router } from "express";
import {
  addAdminHomeGalleryImages,
  getAdminHomeGallery,
  removeAdminHomeGalleryImage,
  reorderAdminHomeGalleryImages,
} from "../../controllers/home-gallery.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { reorderHomeGalleryImagesSchema } from "../../validation/home-gallery.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.maxUploadImageBytes } });

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(getAdminHomeGallery));
router.post("/images", requireCsrf, upload.array("images", 30), requireChangeApproval("Homepage Gallery", "Add images"), asyncHandler(addAdminHomeGalleryImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Homepage Gallery", "Remove image"), asyncHandler(removeAdminHomeGalleryImage));
router.put("/images/order", requireCsrf, validateBody(reorderHomeGalleryImagesSchema), requireChangeApproval("Homepage Gallery", "Reorder images"), asyncHandler(reorderAdminHomeGalleryImages));

export default router;
