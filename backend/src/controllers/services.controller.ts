import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { createService, deleteService, listActiveServices, listAllServices, updateService } from "../services/services.service";
import type { CreateServiceInput } from "../validation/services.schema";

export async function listPublicServices(_req: Request, res: Response) {
  const services = await listActiveServices();
  res.status(200).json({ items: services });
}

export async function listAdminServices(_req: Request, res: Response) {
  const services = await listAllServices();
  res.status(200).json({ items: services });
}

export async function createAdminService(req: Request, res: Response) {
  const input = req.body as CreateServiceInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const service = await createService(input);
  res.status(201).json({ item: service });
}

export async function updateAdminService(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const service = await updateService(id, req.body);
  res.status(200).json({ item: service });
}

export async function deleteAdminService(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteService(id);
  res.status(200).json({ ok: true, message: "Service deleted successfully." });
}
