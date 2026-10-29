import { Router } from "express";
import { getPublicObstetricsAndGynecology } from "../../controllers/obstetrics-and-gynecology.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicObstetricsAndGynecology));

export default router;
