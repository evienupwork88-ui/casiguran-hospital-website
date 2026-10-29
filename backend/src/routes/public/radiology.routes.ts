import { Router } from "express";
import { getPublicRadiology } from "../../controllers/radiology.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicRadiology));

export default router;
