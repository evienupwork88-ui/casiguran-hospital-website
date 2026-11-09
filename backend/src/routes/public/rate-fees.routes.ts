import { Router } from "express";
import { listPublicRateFees } from "../../controllers/rate-fees.controller";
import { getPublicRateFeesSlideshow } from "../../controllers/rate-fees-slideshow.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicRateFees));
router.get("/slideshow", asyncHandler(getPublicRateFeesSlideshow));

export default router;
