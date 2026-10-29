import { Router } from "express";
import { getPublicNutritionAndDietetics } from "../../controllers/nutrition-and-dietetics.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicNutritionAndDietetics));

export default router;
