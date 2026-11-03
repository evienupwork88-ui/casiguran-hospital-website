import multer from "multer";
import { Router } from "express";
import {
  addAdminKeyOfficialsSlideshowImages,
  getAdminKeyOfficialsSlideshow,
  listAdminKeyOfficials,
  removeAdminKeyOfficialsSlideshowImage,
  updateAdminKeyOfficial,
} from "../../controllers/key-officials.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateKeyOfficialSchema } from "../../validation/key-officials.schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/slideshow", asyncHandler(getAdminKeyOfficialsSlideshow));
router.post("/slideshow/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Key Officials", "Add slideshow photos"), asyncHandler(addAdminKeyOfficialsSlideshowImages));
router.delete("/slideshow/images/:index", requireCsrf, requireChangeApproval("Key Officials", "Remove slideshow photo"), asyncHandler(removeAdminKeyOfficialsSlideshowImage));
router.get("/", asyncHandler(listAdminKeyOfficials));
router.put("/:slug", requireCsrf, upload.single("photo"), validateBody(updateKeyOfficialSchema), requireChangeApproval("Key Officials", "Update"), asyncHandler(updateAdminKeyOfficial));

export default router;
