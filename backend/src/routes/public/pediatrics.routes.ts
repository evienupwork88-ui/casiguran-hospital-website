import { Router } from "express";
import { getPublicPediatrics } from "../../controllers/pediatrics.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicPediatrics));

export default router;
