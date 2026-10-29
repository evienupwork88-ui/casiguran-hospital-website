import { Router } from "express";
import { getPublicGeneralMedicine } from "../../controllers/general-medicine.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicGeneralMedicine));

export default router;
