import { Router } from "express";
import { listPublicHolidays } from "../../controllers/holidays.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicHolidays));

export default router;
