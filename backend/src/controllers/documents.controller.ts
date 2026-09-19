import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  createDocument,
  deleteDocument,
  listAllDocuments,
  listPublishedDocuments,
  updateDocument,
  uploadDocument,
} from "../services/documents.service";
import type { CreateDocumentInput, UpdateDocumentInput } from "../validation/documents.schema";

export async function listPublicDocuments(req: Request, res: Response) {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const documents = await listPublishedDocuments(category);
  res.status(200).json({ items: documents });
}

export async function listAdminDocuments(_req: Request, res: Response) {
  const documents = await listAllDocuments();
  res.status(200).json({ items: documents });
}

export async function createAdminDocument(req: Request, res: Response) {
  const input = req.body as CreateDocumentInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const document = await createDocument(input, req.user.id);
  res.status(201).json({ item: document });
}

export async function uploadAdminDocument(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const file = req.file;
  if (!file) {
    throw new AppError(400, "A supported file is required.", "FILE_REQUIRED");
  }

  const category = (req.body.category as CreateDocumentInput["category"]) ?? "report";
  const status = (req.body.status as CreateDocumentInput["status"]) ?? "draft";
  const publishedAt = typeof req.body.publishedAt === "string" ? req.body.publishedAt : null;

  const document = await uploadDocument(
    {
      title: String(req.body.title ?? ""),
      description: typeof req.body.description === "string" ? req.body.description : undefined,
      category,
      status,
      publishedAt,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    },
    req.user.id
  );

  res.status(201).json({ item: document });
}

export async function updateAdminDocument(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = req.body as UpdateDocumentInput;
  const document = await updateDocument(id, input);
  res.status(200).json({ item: document });
}

export async function deleteAdminDocument(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteDocument(id);
  res.status(200).json({ ok: true, message: "Document deleted successfully." });
}
