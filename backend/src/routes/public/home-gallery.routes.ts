import { Router } from "express";
import { getPublicHomeGallery } from "../../controllers/home-gallery.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicHomeGallery));

export default router;
