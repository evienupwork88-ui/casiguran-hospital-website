import { Router } from "express";
import { getPublicPathologyAndLaboratories } from "../../controllers/pathology-laboratories.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPublicPathologyAndLaboratories));

export default router;
