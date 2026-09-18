import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Validates req.body against a Zod schema, replacing it with the
 * parsed (and, per the schema, normalized/trimmed) value. Throws a
 * ZodError on failure, which errorHandler.ts turns into a 400 with
 * field-level detail — safe to show the client, since it's just
 * "what's wrong with what you sent," not internal detail.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
