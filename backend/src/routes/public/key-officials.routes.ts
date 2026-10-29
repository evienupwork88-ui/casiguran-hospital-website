import { Router } from "express";
import { listPublicKeyOfficials } from "../../controllers/key-officials.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicKeyOfficials));

export default router;
