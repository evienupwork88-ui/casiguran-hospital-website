import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

/**
 * Last middleware in the chain (see app.ts). Every thrown/forwarded
 * error ends up here exactly once.
 *
 * Rule: known, expected errors (AppError, ZodError) are safe to describe
 * to the client. Anything else is an unexpected bug — log the real
 * detail server-side, but never leak it to the client (see
 * docs/blueprint.md, Section 7, "Error handling").
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Invalid request",
        code: "VALIDATION_ERROR",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  // Unexpected error — log full detail server-side only.
  console.error(`[unhandled error] ${req.method} ${req.path}:`, err);

  return res.status(500).json({
    error: {
      message: env.isProduction ? "Something went wrong" : String(err),
      code: "INTERNAL_ERROR",
    },
  });
}
