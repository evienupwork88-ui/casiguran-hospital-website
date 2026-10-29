import multer from "multer";
import { Router } from "express";
import {
  createAdminDocument,
  deleteAdminDocument,
  listAdminDocuments,
  uploadAdminOrgChartImage,
  updateAdminDocument,
  uploadAdminDocument,
} from "../../controllers/documents.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { env } from "../../config/env";
import { createDocumentSchema, updateDocumentSchema } from "../../validation/documents.schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const uploadOrgChartImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxOrgChartImageBytes,
  },
});

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminDocuments));
router.post("/org-chart-image", requireCsrf, uploadOrgChartImage.single("file"), requireChangeApproval("Documents", "Upload organizational chart"), asyncHandler(uploadAdminOrgChartImage));
router.post("/", requireCsrf, upload.single("file"), requireChangeApproval("Documents", "Upload"), asyncHandler(uploadAdminDocument));
router.post("/legacy", requireCsrf, validateBody(createDocumentSchema), requireChangeApproval("Documents", "Create"), asyncHandler(createAdminDocument));
router.put("/:id", requireCsrf, validateBody(updateDocumentSchema), requireChangeApproval("Documents", "Update"), asyncHandler(updateAdminDocument));
router.delete("/:id", requireRole("admin", "editor"), requireCsrf, requireChangeApproval("Documents", "Delete"), asyncHandler(deleteAdminDocument));

export default router;
