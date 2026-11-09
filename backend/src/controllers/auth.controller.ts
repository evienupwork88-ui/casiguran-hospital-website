import crypto from "node:crypto";
import { completePasswordReset, requestPasswordReset } from "../services/password-reset.service";
import type { Request, Response } from "express";
import { verifyCredentials } from "../services/auth.service";
import { createSession, revokeSession } from "../services/session.service";
import { getLoginLock, clearLoginFailures, recordLoginFailure } from "../services/login-throttle.service";
import { beginMfaSetup, completeMfaSetup, verifyMfaLogin } from "../services/mfa.service";
import { clearProgressiveThrottle } from "../services/progressive-rate-limit.service";
import { env } from "../config/env";
import type { CompletePasswordResetInput, LoginInput, MfaCodeInput, RequestPasswordResetInput } from "../validation/auth.schema";
import { AppError } from "../utils/AppError";

function cookieOptions(maxAgeMs: number, httpOnly: boolean) {
  return {
    httpOnly,
    secure: env.isProduction,
    sameSite: env.isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: maxAgeMs,
    ...(env.sessionCookieDomain ? { domain: env.sessionCookieDomain } : {}),
  };
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;
  const ipAddress = req.ip ?? "unknown";
  const lockedUntil = await getLoginLock(email, ipAddress);
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    res.setHeader("Retry-After", String(Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)));
    throw new AppError(429, "Too many sign-in attempts. Try again later.", "LOGIN_COOLDOWN");
  }

  let admin: Awaited<ReturnType<typeof verifyCredentials>>;
  try {
    admin = await verifyCredentials(email, password);
  } catch (error) {
    if (error instanceof AppError && error.code === "INVALID_CREDENTIALS") {
      await recordLoginFailure(email, ipAddress);
    }
    throw error;
  }
  req.user = admin;

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
      firstName: admin.firstName,
      middleName: admin.middleName,
      lastName: admin.lastName,
      nameExtension: admin.nameExtension,
      role: admin.role,
      mfaEnabled: admin.mfaEnabled,
      requiresMfaSetup: !admin.mfaEnabled,
      requiresMfaVerification: admin.mfaEnabled,
    },
    csrfToken,
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as RequestPasswordResetInput;
  await requestPasswordReset(email);
  res.status(200).json({
    message: "If an active account uses that email, a verification code has been sent.",
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { email } = req.body as CompletePasswordResetInput;
  await completePasswordReset(req.body as CompletePasswordResetInput);
  try {
    await Promise.all([
      clearProgressiveThrottle("password_reset_account", email),
      clearProgressiveThrottle("password_reset_ip", req.ip ?? req.socket.remoteAddress ?? "unknown"),
    ]);
  } catch (error) {
    console.error("[password reset] Failed to clear progressive cooldown after a successful reset:", error);
  }
  res.status(200).json({ message: "Password reset successfully. Sign in with your new password." });
}

export async function logout(req: Request, res: Response) {
  const rawToken = req.cookies?.[env.sessionCookieName];
  if (rawToken) {
    await revokeSession(rawToken);
  }

  const clearCookieOptions = {
    path: "/",
    ...(env.sessionCookieDomain ? { domain: env.sessionCookieDomain } : {}),
  };
  res.clearCookie(env.sessionCookieName, clearCookieOptions);
  res.clearCookie(env.csrfCookieName, clearCookieOptions);

  res.status(200).json({ message: "Logged out" });
}

export async function me(req: Request, res: Response) {
  if (!req.user || !req.session) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({
    user: {
      ...req.user,
      requiresMfaSetup: !req.user.mfaEnabled,
      requiresMfaVerification: req.user.mfaEnabled && !req.session.mfaVerifiedAt,
    },
    csrfToken: req.cookies?.[env.csrfCookieName] ?? null,
  });
}

export async function startMfaSetup(req: Request, res: Response) {
  if (!req.user || !req.session) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const setup = await beginMfaSetup(req.user, req.session.id);
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json(setup);
}

export async function finishMfaSetup(req: Request, res: Response) {
  if (!req.user || !req.session) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  await assertMfaAttemptAllowed(req.user.email, req.ip ?? "unknown", res);
  let enrollment: Awaited<ReturnType<typeof completeMfaSetup>>;
  try {
    enrollment = await completeMfaSetup(req.user, req.session, (req.body as MfaCodeInput).code);
  } catch (error) {
    await recordInvalidMfaAttempt(error, req.user.email, req.ip ?? "unknown", res);
    throw error;
  }
  await clearLoginThrottleAfterMfa(req.user.email, req.ip ?? "unknown");
  const csrfToken = setVerifiedSessionCookies(res, enrollment.rawToken);
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({ recoveryCodes: enrollment.recoveryCodes, csrfToken });
}

export async function verifyMfa(req: Request, res: Response) {
  if (!req.user || !req.session) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const input = req.body as MfaCodeInput;
  const ipAddress = req.ip ?? "unknown";
  await assertMfaAttemptAllowed(req.user.email, ipAddress, res);

  let rawToken: string;
  try {
    rawToken = await verifyMfaLogin(req.user.id, req.session.id, input.code, input.useRecoveryCode ?? false);
  } catch (error) {
    await recordInvalidMfaAttempt(error, req.user.email, ipAddress, res);
    throw error;
  }

  await clearLoginThrottleAfterMfa(req.user.email, ipAddress);
  const csrfToken = setVerifiedSessionCookies(res, rawToken);
  res.status(200).json({ message: "MFA verified", csrfToken });
}

async function assertMfaAttemptAllowed(email: string, ipAddress: string, res: Response) {
  const lockedUntil = await getLoginLock(email, ipAddress);
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    res.setHeader("Retry-After", String(Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)));
    throw new AppError(429, "Too many sign-in attempts. Try again later.", "LOGIN_COOLDOWN");
  }
}

async function recordInvalidMfaAttempt(error: unknown, email: string, ipAddress: string, res: Response) {
  if (error instanceof AppError && error.code === "INVALID_MFA_CODE") {
    const lockedUntil = await recordLoginFailure(email, ipAddress);
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      res.setHeader("Retry-After", String(Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)));
      throw new AppError(429, "Too many sign-in attempts. Try again later.", "LOGIN_COOLDOWN");
    }
  }
}

async function clearLoginThrottleAfterMfa(email: string, ipAddress: string) {
  try {
    await clearLoginFailures(email, ipAddress);
  } catch (error) {
    console.error("[login cooldown reset failed after MFA]", error);
  }
}

function setVerifiedSessionCookies(res: Response, rawToken: string) {
  const maxAgeMs = env.sessionTtlHours * 60 * 60 * 1000;
  res.cookie(env.sessionCookieName, rawToken, cookieOptions(maxAgeMs, true));
  const csrfToken = crypto.randomBytes(24).toString("hex");
  res.cookie(env.csrfCookieName, csrfToken, cookieOptions(maxAgeMs, false));
  return csrfToken;
}
