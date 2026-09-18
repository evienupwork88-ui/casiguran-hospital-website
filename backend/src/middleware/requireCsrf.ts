import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Double-submit cookie CSRF protection (see docs/blueprint.md, Section 7).
 * Applied only to state-changing routes that rely on the session cookie
 * for auth — mount AFTER requireAuth, never on login itself (no CSRF
 * cookie exists yet at that point) and never on plain GETs.
 *
 * Why this works: a cross-site attacker can make the browser attach
 * cookies to a forged request, but cannot READ the csrf cookie's value
 * (blocked by same-origin policy) to also put it in the header — so a
 * forged request will always be missing a matching header.
 */
export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError(403, "Invalid or missing CSRF token", "CSRF_FAILED"));
  }

  next();
}
