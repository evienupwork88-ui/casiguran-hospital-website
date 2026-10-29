import { Router } from "express";
import { getPublicEmergencyDepartment } from "../../controllers/emergency-department.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicEmergencyDepartment));

export default router;
