import { Router } from "express";
import { finishMfaSetup, forgotPassword, login, logout, me, resetPassword, startMfaSetup, verifyMfa } from "../controllers/auth.controller";
import { requireSession } from "../middleware/requireAuth";
import { requireCsrf } from "../middleware/requireCsrf";
import { validateBody } from "../middleware/validate";
import { completePasswordResetSchema, loginSchema, mfaCodeSchema, requestPasswordResetSchema } from "../validation/auth.schema";
import { passwordResetRateLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// No auth required — this IS how auth begins. No CSRF check either:
// no session/csrf cookie pair exists yet at this point (see
// requireCsrf.ts for why login is deliberately excluded).
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.post("/forgot-password", validateBody(requestPasswordResetSchema), passwordResetRateLimiter, asyncHandler(forgotPassword));
router.post("/reset-password", validateBody(completePasswordResetSchema), passwordResetRateLimiter, asyncHandler(resetPassword));

// Requires an existing session AND a matching CSRF header, since this
// is a state-changing request authenticated by cookie.
router.post("/logout", requireSession, requireCsrf, asyncHandler(logout));

// A password-verified session may only inspect its MFA state or finish enrollment.
router.get("/me", requireSession, asyncHandler(me));
router.post("/mfa/setup", requireSession, requireCsrf, asyncHandler(startMfaSetup));
router.post("/mfa/setup/complete", requireSession, requireCsrf, validateBody(mfaCodeSchema), asyncHandler(finishMfaSetup));
router.post("/mfa/verify", requireSession, requireCsrf, validateBody(mfaCodeSchema), asyncHandler(verifyMfa));

export default router;
