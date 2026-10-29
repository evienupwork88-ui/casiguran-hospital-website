import { Router } from "express";
import { getPublicFamilyCommunityMedicine } from "../../controllers/family-community-medicine.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicFamilyCommunityMedicine));

export default router;
