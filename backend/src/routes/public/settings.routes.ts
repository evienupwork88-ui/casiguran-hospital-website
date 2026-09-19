import { Router } from "express";
import { listPublicSettings } from "../../controllers/settings.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicSettings));

export default router;
