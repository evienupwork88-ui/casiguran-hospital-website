import { z } from "zod";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { containsProfanity } from "../utils/profanity-filter";
import type { CreateContactMessageInput } from "../validation/contact-messages.schema";
import type { UpdateContactMessageInput } from "../validation/contact-messages.schema";

export type ContactMessageStatus = "new" | "read" | "flagged" | "replied" | "archived";
export type ContactActionTaken = "Called" | "FB Messaged" | "Forwarded to GC" | "Done";

export interface ContactMessageRecord {
  id: string;
  name: string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  nameExtension: string | null;
  email: string | null;
  phoneNumber: string | null;
  contactInfo: string;
  subject: string;
  departmentTag: string;
  message: string;
  status: ContactMessageStatus;
  assignedTo: string | null;
  actionTaken: ContactActionTaken | null;
  remarks: string;
  ipAddress: string | null;
  userAgent: string | null;
  isFlagged: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface ContactMessageNotificationSummary {
  unreadCount: number;
  items: {
    id: string;
    name: string;
    subject: string;
    createdAt: string;
  }[];
}

type ContactMessageRow = {
  id: string;
  name: string;
  last_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  name_extension: string | null;
  email: string | null;
  phone_number: string | null;
  subject: string;
  department_tag: string;
  message: string;
  status: ContactMessageStatus;
  assigned_to: string | null;
  action_taken: ContactActionTaken | null;
  remarks: string;
  ip_address: string | null;
  user_agent: string | null;
  is_flagged: boolean;
  is_archived: boolean;
  created_at: string;
  read_at: string | null;
};

const CONTACT_MESSAGE_COLUMNS = "id, name, last_name, first_name, middle_name, name_extension, email, phone_number, subject, department_tag, message, status, assigned_to, action_taken, remarks, ip_address, user_agent, is_flagged, is_archived, created_at, read_at";

function mapContactMessage(row: ContactMessageRow): ContactMessageRecord {
  const contactInfo = row.email ?? row.phone_number ?? "";
  return {
    id: row.id,
    name: row.name,
    lastName: row.last_name,
    firstName: row.first_name,
    middleName: row.middle_name,
    nameExtension: row.name_extension,
    email: row.email,
    phoneNumber: row.phone_number,
    contactInfo,
    subject: row.subject,
    departmentTag: row.department_tag,
    message: row.message,
    status: row.status,
    assignedTo: row.assigned_to,
    actionTaken: row.action_taken,
    remarks: row.remarks ?? "",
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    isFlagged: row.is_flagged,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function createContactMessage(
  input: CreateContactMessageInput,
  metadata: { ipAddress: string | null; userAgent: string | null },
): Promise<void> {
  const name = [input.firstName, input.middleName, input.lastName, input.nameExtension].filter(Boolean).join(" ");
  const isEmail = z.string().email().safeParse(input.contactInfo).success;
  const flagged = [input.firstName, input.middleName, input.lastName, input.nameExtension, input.message]
    .filter((value): value is string => Boolean(value))
    .some((value) => containsProfanity(value));
  if (flagged) {
    throw new AppError(400, "Please use respectful language", "CONTACT_LANGUAGE_FLAGGED");
  }
  const { error } = await supabase.from("contact_messages").insert({
    name,
    last_name: input.lastName,
    first_name: input.firstName,
    middle_name: input.middleName || null,
    name_extension: input.nameExtension || null,
    email: isEmail ? input.contactInfo : null,
    phone_number: isEmail ? null : input.contactInfo,
    subject: input.subject,
    department_tag: input.subject,
    message: input.message,
    status: "new",
    is_flagged: false,
    ip_address: metadata.ipAddress,
    user_agent: metadata.userAgent,
  });

  if (error) throw new Error(`Failed to save contact message: ${error.message}`);
}

export async function listContactMessages(): Promise<ContactMessageRecord[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select(CONTACT_MESSAGE_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load contact messages: ${error.message}`);
  return ((data ?? []) as ContactMessageRow[]).map(mapContactMessage);
}

export async function listContactMessageAssignees(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, full_name, first_name, middle_name, last_name, name_extension")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load contact message assignees: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: [row.first_name, row.middle_name, row.last_name, row.name_extension].filter(Boolean).join(" ") || row.full_name,
  }));
}

export async function getContactMessageNotificationSummary(): Promise<ContactMessageNotificationSummary> {
  const { data, count, error } = await supabase
    .from("contact_messages")
    .select("id, name, subject, created_at", { count: "exact" })
    .in("status", ["new", "flagged"])
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw new Error(`Failed to load contact message notifications: ${error.message}`);
  if (count === null) throw new Error("Failed to load contact message notification count.");
  return {
    unreadCount: count,
    items: ((data ?? []) as Pick<ContactMessageRow, "id" | "name" | "subject" | "created_at">[]).map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      createdAt: row.created_at,
    })),
  };
}

export async function updateContactMessage(id: string, input: UpdateContactMessageInput): Promise<ContactMessageRecord> {
  const update: Record<string, unknown> = {};
  if (input.assignedTo !== undefined) update.assigned_to = input.assignedTo || null;
  if (input.actionTaken !== undefined) update.action_taken = input.actionTaken || null;
  if (input.remarks !== undefined) update.remarks = input.remarks;
  if (input.isArchived !== undefined) {
    update.is_archived = input.isArchived;
    update.status = input.isArchived ? "archived" : "read";
  }
  if (input.status !== undefined) {
    update.status = input.status;
    if (input.status === "flagged") {
      update.is_flagged = true;
      update.is_archived = false;
    } else if (input.status === "archived") {
      update.is_archived = true;
    } else {
      update.is_archived = false;
    }
  }
  if (input.status === "read") update.read_at = new Date().toISOString();
  const { data, error } = await supabase.from("contact_messages").update(update).eq("id", id).select(CONTACT_MESSAGE_COLUMNS).maybeSingle();
  if (error) throw new Error(`Failed to update contact message: ${error.message}`);
  if (!data) throw new AppError(404, "Contact message not found.", "CONTACT_MESSAGE_NOT_FOUND");
  return mapContactMessage(data as ContactMessageRow);
}

export async function markContactMessageRead(id: string): Promise<ContactMessageRecord> {
  return updateContactMessage(id, { status: "read" });
}
