import { Router } from "express";
import { listPublicServices } from "../../controllers/services.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicServices));

export default router;
