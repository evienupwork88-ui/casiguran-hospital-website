import { Router } from "express";
import { getPublicEventById, listPublicEvents } from "../../controllers/events.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicEvents));
router.get("/:id", asyncHandler(getPublicEventById));

export default router;
