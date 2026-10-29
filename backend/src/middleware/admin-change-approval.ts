import type { NextFunction, Request, Response } from "express";
import { authorizeApprovedChangeRequest, createAdminChangeRequest } from "../services/admin-change-requests.service";
import { AppError } from "../utils/AppError";

export function requireChangeApproval(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Not authenticated.", "UNAUTHENTICATED"));
      return;
    }

    const approvalId = req.get("x-admin-change-request-id");
    if (approvalId) {
      try {
        await authorizeApprovedChangeRequest(req, res, approvalId);
        next();
      } catch (error) {
        next(error);
      }
      return;
    }

    if (req.user.role === "admin") {
      next();
      return;
    }

    try {
      const requestId = await createAdminChangeRequest(req, resource, action);
      res.status(409).json({
        error: {
          code: "CHANGE_APPROVAL_PENDING",
          message: "Your proposed change was sent to the Super Admin for approval.",
          requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
