import { Router } from "express";
import {
  approveAdminChangeRequest,
  getAdminChangeRequestFile,
  listAdminChangeRequestsController,
  rejectAdminChangeRequest,
} from "../../controllers/admin-change-requests.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { rejectAdminChangeRequestSchema } from "../../validation/admin-change-requests.schema";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(listAdminChangeRequestsController));
router.get("/:id/files/:index", asyncHandler(getAdminChangeRequestFile));
router.post("/:id/approve", requireCsrf, asyncHandler(approveAdminChangeRequest));
router.post("/:id/reject", requireCsrf, validateBody(rejectAdminChangeRequestSchema), asyncHandler(rejectAdminChangeRequest));

export default router;
