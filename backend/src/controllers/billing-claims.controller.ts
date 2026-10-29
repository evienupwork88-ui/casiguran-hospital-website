import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addBillingClaimsImages, getBillingClaimsContent, removeBillingClaimsImage, replaceBillingClaimsChart, updateBillingClaimsContent } from "../services/billing-claims.service";
import { billingClaimsSectionSchema, type UpdateBillingClaimsContentInput } from "../validation/billing-claims.schema";

function getSection(req: Request) {
  const rawSection = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
  const parsed = billingClaimsSectionSchema.safeParse(rawSection);
  if (!parsed.success) throw new AppError(404, "Billing or Claims section not found.", "BILLING_CLAIMS_SECTION_NOT_FOUND");
  return parsed.data;
}

export async function getPublicBillingClaims(req: Request, res: Response) {
  res.status(200).json({ item: await getBillingClaimsContent(getSection(req)) });
}

export async function getAdminBillingClaims(req: Request, res: Response) {
  res.status(200).json({ item: await getBillingClaimsContent(getSection(req)) });
}

export async function updateAdminBillingClaims(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateBillingClaimsContent(getSection(req), req.body as UpdateBillingClaimsContentInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminBillingClaimsImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || !req.files.length) throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  const item = await addBillingClaimsImages(getSection(req), req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminBillingClaimsImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeBillingClaimsImage(getSection(req), index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminBillingClaimsChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose an organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceBillingClaimsChart(getSection(req), req.file, req.user.id);
  res.status(200).json({ item });
}
