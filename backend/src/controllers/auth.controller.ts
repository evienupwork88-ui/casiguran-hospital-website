import crypto from "node:crypto";
import type { Request, Response } from "express";
import { verifyCredentials } from "../services/auth.service";
import { createSession, revokeSession } from "../services/session.service";
import { env } from "../config/env";
import type { LoginInput } from "../validation/auth.schema";

function cookieOptions(maxAgeMs: number, httpOnly: boolean) {
  return {
    httpOnly,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const admin = await verifyCredentials(email, password);

  const { rawToken, expiresAt } = await createSession(admin.id, {
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  const maxAgeMs = expiresAt.getTime() - Date.now();
  const csrfToken = crypto.randomBytes(24).toString("hex");

  res.cookie(env.sessionCookieName, rawToken, cookieOptions(maxAgeMs, true));
  res.cookie(env.csrfCookieName, csrfToken, cookieOptions(maxAgeMs, false));

  res.status(200).json({
    user: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const rawToken = req.cookies?.[env.sessionCookieName];
  if (rawToken) {
    await revokeSession(rawToken);
  }

  res.clearCookie(env.sessionCookieName, { path: "/" });
  res.clearCookie(env.csrfCookieName, { path: "/" });

  res.status(200).json({ message: "Logged out" });
}

export async function me(req: Request, res: Response) {
  // requireAuth has already run and attached req.user.
  res.status(200).json({ user: req.user });
}
