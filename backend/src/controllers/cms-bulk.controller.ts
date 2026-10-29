import type { Request, Response } from "express";
import {
  deleteAnnouncement,
  createAnnouncement,
} from "../services/announcements.service";
import { assertDocumentFileExists, createDocument, deleteDocument } from "../services/documents.service";
import { createEvent, deleteEvent } from "../services/events.service";
import { archiveFaq, createFaq } from "../services/faqs.service";
import { createNews, deleteNews } from "../services/news.service";
import { createRateFeeItem, deleteRateFeeItem } from "../services/rate-fees.service";
import { createTraining, deleteTraining } from "../services/trainings.service";
import type { CmsBulkDeleteInput, CmsBulkImportInput } from "../validation/cms-bulk.schema";
import { AppError } from "../utils/AppError";

type BatchFailure = { row: number; message: string };

async function runBatch<T>(
  records: T[],
  operation: (record: T, index: number) => Promise<unknown>,
  failureRows?: number[],
): Promise<{ succeeded: number; failures: BatchFailure[] }> {
  const failures: BatchFailure[] = [];
  for (const [index, record] of records.entries()) {
    try {
      await operation(record, index);
    } catch (error) {
      const message = error instanceof AppError
        ? error.message
        : "Unexpected server error; contact IT if the problem persists.";
      failures.push({ row: failureRows?.[index] ?? index + 2, message });
    }
  }
  return { succeeded: records.length - failures.length, failures };
}

export async function importAdminCmsRecords(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");

  const input = req.body as CmsBulkImportInput;
  const authorId = req.user.id;
  let result: Awaited<ReturnType<typeof runBatch>>;
  switch (input.resource) {
    case "news": result = await runBatch(input.items, (item) => createNews(item, authorId), input.rowNumbers); break;
    case "announcements": result = await runBatch(input.items, (item) => createAnnouncement(item, authorId), input.rowNumbers); break;
    case "events": result = await runBatch(input.items, (item) => createEvent(item, authorId), input.rowNumbers); break;
    case "faqs": result = await runBatch(input.items, (item) => createFaq(item, authorId), input.rowNumbers); break;
    case "trainings": result = await runBatch(input.items, (item) => createTraining(item, authorId), input.rowNumbers); break;
    case "rate-fees": result = await runBatch(input.items, (item) => createRateFeeItem(item), input.rowNumbers); break;
    case "documents": result = await runBatch(input.items, async (item) => {
      await assertDocumentFileExists(item.filePath);
      return createDocument(item, authorId);
    }, input.rowNumbers); break;
  }

  res.status(result.failures.length ? 207 : 201).json(result);
}

export async function deleteAdminCmsRecords(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");

  const input = req.body as CmsBulkDeleteInput;
  const actorId = req.user.id;
  const result = await runBatch(input.ids, async (id) => {
    switch (input.resource) {
      case "news": return deleteNews(id);
      case "announcements": return deleteAnnouncement(id);
      case "events": return deleteEvent(id);
      case "faqs": return archiveFaq(id, actorId);
      case "trainings": return deleteTraining(id);
      case "rate-fees": return deleteRateFeeItem(id);
      case "documents": return deleteDocument(id);
    }
  });

  res.status(result.failures.length ? 207 : 200).json(result);
}
