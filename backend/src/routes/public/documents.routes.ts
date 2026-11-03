import { Router } from "express";
import { getPublicCitizensCharterSlideshow } from "../../controllers/citizens-charter-slideshow.controller";
import { listPublicDocuments } from "../../controllers/documents.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicDocuments));
router.get("/citizens-charter/slideshow", asyncHandler(getPublicCitizensCharterSlideshow));

export default router;
