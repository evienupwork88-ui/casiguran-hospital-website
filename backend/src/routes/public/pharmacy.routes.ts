import { Router } from "express";
import { getPublicPharmacy } from "../../controllers/pharmacy.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicPharmacy));

export default router;
