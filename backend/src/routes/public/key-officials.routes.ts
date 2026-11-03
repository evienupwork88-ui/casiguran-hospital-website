import { Router } from "express";
import { getPublicKeyOfficialsSlideshow, listPublicKeyOfficials } from "../../controllers/key-officials.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicKeyOfficials));
router.get("/slideshow", asyncHandler(getPublicKeyOfficialsSlideshow));

export default router;
