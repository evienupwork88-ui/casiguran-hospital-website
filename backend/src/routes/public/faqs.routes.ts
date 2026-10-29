import { Router } from "express";
import { listPublicFaqs } from "../../controllers/faqs.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicFaqs));

export default router;
