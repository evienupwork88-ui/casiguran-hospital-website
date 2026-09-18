/**
 * A deliberate, expected error with an HTTP status attached — as opposed
 * to an unexpected bug. Controllers/services throw this; errorHandler.ts
 * catches it and knows it's safe to show `message` to the client.
 * Anything that is NOT an AppError is treated as a bug and given a
 * generic message instead (see errorHandler.ts).
 */
export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}
