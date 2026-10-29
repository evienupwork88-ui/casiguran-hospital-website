import { Router } from "express";
import { submitPublicContactMessage } from "../../controllers/contact-messages.controller";
import { limitContactSubmissions, rejectHoneypot } from "../../middleware/contact-message-limits";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createContactMessageSchema } from "../../validation/contact-messages.schema";

const router = Router();

router.post("/", rejectHoneypot, validateBody(createContactMessageSchema), limitContactSubmissions, asyncHandler(submitPublicContactMessage));

export default router;
