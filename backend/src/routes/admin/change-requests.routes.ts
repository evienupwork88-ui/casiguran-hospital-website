import { Router } from "express";
import {
  approveAdminChangeRequest,
  getAdminChangeRequestFile,
  listAdminChangeRequestsController,
  listMyRejectedChangeRequestsController,
  markRejectedAdminChangeRequestRead,
  rejectAdminChangeRequest,
} from "../../controllers/admin-change-requests.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { rejectAdminChangeRequestSchema } from "../../validation/admin-change-requests.schema";

const router = Router();

router.use(requireAuth);
router.get("/rejected", requireRole("admin", "editor"), asyncHandler(listMyRejectedChangeRequestsController));
router.patch("/:id/read", requireRole("admin", "editor"), requireCsrf, asyncHandler(markRejectedAdminChangeRequestRead));
router.use(requireRole("admin"));
router.get("/", asyncHandler(listAdminChangeRequestsController));
router.get("/:id/files/:index", asyncHandler(getAdminChangeRequestFile));
router.post("/:id/approve", requireCsrf, asyncHandler(approveAdminChangeRequest));
router.post("/:id/reject", requireCsrf, validateBody(rejectAdminChangeRequestSchema), asyncHandler(rejectAdminChangeRequest));

export default router;
