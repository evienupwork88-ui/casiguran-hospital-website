import { Router } from "express";
import { getPublicOpd } from "../../controllers/opd.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicOpd));

export default router;
