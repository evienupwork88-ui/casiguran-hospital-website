import { Router } from "express";
import { getPublicBillingClaims } from "../../controllers/billing-claims.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/:section", asyncHandler(getPublicBillingClaims));

export default router;
