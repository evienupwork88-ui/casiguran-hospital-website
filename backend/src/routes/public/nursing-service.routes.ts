import { Router } from "express";
import { getPublicNursingService } from "../../controllers/nursing-service.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicNursingService));

export default router;
