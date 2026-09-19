import { Router } from "express";
import { getPublicPageBySlug, listPublicPages } from "../../controllers/pages.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicPages));
router.get("/:slug", asyncHandler(getPublicPageBySlug));

export default router;
