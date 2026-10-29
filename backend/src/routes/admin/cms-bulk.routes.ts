import { Router } from "express";
import { deleteAdminCmsRecords, importAdminCmsRecords } from "../../controllers/cms-bulk.controller";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { cmsBulkDeleteSchema, cmsBulkImportSchema } from "../../validation/cms-bulk.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.post("/import", requireCsrf, validateBody(cmsBulkImportSchema), requireChangeApproval("CMS bulk import", "Import"), asyncHandler(importAdminCmsRecords));
router.post("/delete", requireCsrf, validateBody(cmsBulkDeleteSchema), requireChangeApproval("CMS bulk deletion", "Delete"), asyncHandler(deleteAdminCmsRecords));

export default router;
