import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireCsrf } from "../middleware/requireCsrf";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../validation/auth.schema";
import { loginRateLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// No auth required — this IS how auth begins. No CSRF check either:
// no session/csrf cookie pair exists yet at this point (see
// requireCsrf.ts for why login is deliberately excluded).
router.post("/login", loginRateLimiter, validateBody(loginSchema), asyncHandler(login));

// Requires an existing session AND a matching CSRF header, since this
// is a state-changing request authenticated by cookie.
router.post("/logout", requireAuth, requireCsrf, asyncHandler(logout));

// Read-only — requires auth, no CSRF needed (GET, not state-changing).
router.get("/me", requireAuth, asyncHandler(me));

export default router;
