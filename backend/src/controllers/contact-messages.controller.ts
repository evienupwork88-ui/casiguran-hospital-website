import type { Request, Response } from "express";
import { listAdminChangeRequests, getAdminChangeRequestCount } from "../services/admin-change-requests.service";
import { createContactMessage, getContactMessageNotificationSummary, listContactMessageAssignees, listContactMessages, markContactMessageRead, updateContactMessage } from "../services/contact-messages.service";
import type { CreateContactMessageInput, UpdateContactMessageInput } from "../validation/contact-messages.schema";

export async function submitPublicContactMessage(req: Request, res: Response) {
  const input = req.body as CreateContactMessageInput;
  await createContactMessage(input, {
    ipAddress: (req.ip ?? req.socket.remoteAddress)?.slice(0, 64) ?? null,
    userAgent: req.get("user-agent")?.slice(0, 500) ?? null,
  });
  res.status(201).json({ message: `Natanggap na namin. Na-tag ito para sa ${input.subject} at ire-review ng team.` });
}

export async function listAdminContactMessages(_req: Request, res: Response) {
  res.status(200).json({ items: await listContactMessages() });
}

export async function getAdminContactMessageNotifications(req: Request, res: Response) {
  const summary = await getContactMessageNotificationSummary();
  if (req.user?.role === "admin") {
    const [pendingRequestCount, changeRequests] = await Promise.all([
      getAdminChangeRequestCount(),
      listAdminChangeRequests(5),
    ]);
    res.status(200).json({ ...summary, pendingRequestCount, changeRequests });
    return;
  }
  res.status(200).json({ ...summary, pendingRequestCount: 0, changeRequests: [] });
}

export async function listAdminContactMessageAssignees(_req: Request, res: Response) {
  res.status(200).json({ items: await listContactMessageAssignees() });
}

export async function markAdminContactMessageRead(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.status(200).json({ item: await markContactMessageRead(id) });
}

export async function updateAdminContactMessage(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = await updateContactMessage(id, req.body as UpdateContactMessageInput);
  res.status(200).json({ item });
}
