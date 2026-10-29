import { Router } from "express";
import { getPublicHimd, getPublicHimdSlideshow } from "../../controllers/himd.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/slideshow", asyncHandler(getPublicHimdSlideshow));
router.get("/:section", asyncHandler(getPublicHimd));

export default router;
