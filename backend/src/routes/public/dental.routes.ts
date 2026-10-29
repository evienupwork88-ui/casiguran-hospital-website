import { Router } from "express";
import { getPublicDental } from "../../controllers/dental.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicDental));

export default router;
