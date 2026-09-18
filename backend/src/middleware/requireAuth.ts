import type { NextFunction, Request, Response } from "express";
import { findValidSession } from "../services/session.service";
import { getAdminById } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import type { AuthenticatedAdmin } from "../services/auth.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedAdmin;
    }
  }
}

/**
 * Reads the session cookie, validates it against the sessions table,
 * and attaches req.user. 401s on anything invalid — expired, revoked,
 * missing cookie, or an admin account that's since been deactivated.
 *
 * Deliberately does not distinguish these cases in the response: from
 * the client's point of view "not authenticated" is one condition.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const rawToken = req.cookies?.[env.sessionCookieName];

  if (!rawToken) {
    return next(new AppError(401, "Not authenticated", "UNAUTHENTICATED"));
  }

  const session = await findValidSession(rawToken);
  if (!session) {
    return next(new AppError(401, "Not authenticated", "UNAUTHENTICATED"));
  }

  const admin = await getAdminById(session.adminUserId);
  if (!admin) {
    return next(new AppError(401, "Not authenticated", "UNAUTHENTICATED"));
  }

  req.user = admin;
  next();
}
