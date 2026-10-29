import { Router } from "express";
import { listPublicTrainingItems } from "../../controllers/trainings.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicTrainingItems));

export default router;
