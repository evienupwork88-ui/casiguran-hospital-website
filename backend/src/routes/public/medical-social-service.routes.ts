import { Router } from "express";
import { getPublicMedicalSocialService } from "../../controllers/medical-social-service.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicMedicalSocialService));

export default router;
