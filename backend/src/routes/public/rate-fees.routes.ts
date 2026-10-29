import { Router } from "express";
import { listPublicRateFees } from "../../controllers/rate-fees.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicRateFees));

export default router;
