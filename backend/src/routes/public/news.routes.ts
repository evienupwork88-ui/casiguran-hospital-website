import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getPublicNewsBySlug, listPublicNews } from "../../controllers/news.controller";

const router = Router();

router.get("/", asyncHandler(listPublicNews));
router.get("/:slug", asyncHandler(getPublicNewsBySlug));

export default router;
