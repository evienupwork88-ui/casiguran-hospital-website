import { Router } from "express";
import { submitPublicContactMessage } from "../../controllers/contact-messages.controller";
import { rejectHoneypot } from "../../middleware/contact-message-limits";
import { contactMessageRateLimiter } from "../../middleware/rateLimit";
import { validateBody } from "../../middleware/validate";
import { verifyContactTurnstile } from "../../middleware/verify-contact-turnstile";
import { asyncHandler } from "../../utils/asyncHandler";
import { createContactMessageSchema } from "../../validation/contact-messages.schema";

const router = Router();

router.post("/", rejectHoneypot, validateBody(createContactMessageSchema), contactMessageRateLimiter, verifyContactTurnstile, asyncHandler(submitPublicContactMessage));

export default router;
