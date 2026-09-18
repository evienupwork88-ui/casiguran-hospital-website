import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async controller so a thrown/rejected error is forwarded to
 * next() — and therefore to errorHandler.ts — instead of crashing the
 * process or hanging the request. Express does not do this automatically
 * for async functions.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
