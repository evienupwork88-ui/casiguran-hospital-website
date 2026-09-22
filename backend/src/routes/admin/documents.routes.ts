import multer from "multer";
import { Router } from "express";
import {
  createAdminDocument,
  deleteAdminDocument,
  listAdminDocuments,
  updateAdminDocument,
  uploadAdminDocument,
} from "../../controllers/documents.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createDocumentSchema, updateDocumentSchema } from "../../validation/documents.schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminDocuments));
router.post("/", requireCsrf, upload.single("file"), asyncHandler(uploadAdminDocument));
router.post("/legacy", requireCsrf, validateBody(createDocumentSchema), asyncHandler(createAdminDocument));
router.put("/:id", requireCsrf, validateBody(updateDocumentSchema), asyncHandler(updateAdminDocument));
router.delete("/:id", requireRole("admin"), requireCsrf, asyncHandler(deleteAdminDocument));

export default router;
