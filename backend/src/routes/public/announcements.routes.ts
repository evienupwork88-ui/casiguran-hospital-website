import { Router } from "express";
import {
  getPublicAnnouncementById,
  listPublicAnnouncements,
} from "../../controllers/announcements.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicAnnouncements));
router.get("/:id", asyncHandler(getPublicAnnouncementById));

export default router;
