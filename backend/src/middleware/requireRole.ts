import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

/**
 * Must run AFTER requireAuth (needs req.user already set). Kept as a
 * separate middleware rather than folded into requireAuth so each route
 * states its own requirement explicitly and readably — see how it's
 * used in routes/auth.routes.ts and, later, every admin domain's routes.
 */
export function requireRole(...allowedRoles: Array<"admin" | "editor">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      // Programmer error (route wired without requireAuth first), not a
      // client-facing 401 — fail loudly rather than silently allowing.
      throw new Error("requireRole used without requireAuth running first");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission to do that", "FORBIDDEN"));
    }

    next();
  };
}
