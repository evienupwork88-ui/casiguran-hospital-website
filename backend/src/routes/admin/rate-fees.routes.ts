import { Router } from "express";
import { createAdminRateFee, deleteAdminRateFee, listAdminRateFees, updateAdminRateFee } from "../../controllers/rate-fees.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { rateFeeItemSchema, updateRateFeeItemSchema } from "../../validation/rate-fees.schema";

const router = Router();

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(listAdminRateFees));
router.post("/", requireCsrf, validateBody(rateFeeItemSchema), requireChangeApproval("Rate & Fees", "Create"), asyncHandler(createAdminRateFee));
router.put("/:id", requireCsrf, validateBody(updateRateFeeItemSchema), requireChangeApproval("Rate & Fees", "Update"), asyncHandler(updateAdminRateFee));
router.delete("/:id", requireRole("admin", "editor"), requireCsrf, requireChangeApproval("Rate & Fees", "Delete"), asyncHandler(deleteAdminRateFee));

export default router;
