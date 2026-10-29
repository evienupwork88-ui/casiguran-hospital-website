import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { containsProfanity } from "../utils/profanity-filter";
import type { CreateFaqInput, UpdateFaqInput } from "../validation/faqs.schema";

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  category: CreateFaqInput["category"];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: FaqRecord["category"];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

const FAQ_COLUMNS = "id, question, answer, category, display_order, is_active, created_at, updated_at, updated_by";

function mapFaq(row: FaqRow): FaqRecord {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function listFaqs(activeOnly = false): Promise<FaqRecord[]> {
  let query = supabase.from("faqs").select(FAQ_COLUMNS);
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.order("display_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load FAQs: ${error.message}`);
  return ((data ?? []) as FaqRow[]).map(mapFaq);
}

export async function createFaq(input: CreateFaqInput, updatedBy: string): Promise<FaqRecord> {
  if (containsProfanity(input.question) || containsProfanity(input.answer)) {
    throw new AppError(400, "Please use respectful language.", "FAQ_LANGUAGE_FLAGGED");
  }
  const { data, error } = await supabase.from("faqs").insert({
    question: input.question,
    answer: input.answer,
    category: input.category,
    display_order: input.displayOrder,
    is_active: input.isActive,
    updated_by: updatedBy,
  }).select(FAQ_COLUMNS).single();
  if (error) throw new Error(`Failed to create FAQ: ${error.message}`);
  return mapFaq(data as FaqRow);
}

export async function updateFaq(id: string, input: UpdateFaqInput, updatedBy: string): Promise<FaqRecord> {
  if ((input.question && containsProfanity(input.question)) || (input.answer && containsProfanity(input.answer))) {
    throw new AppError(400, "Please use respectful language.", "FAQ_LANGUAGE_FLAGGED");
  }
  const update: Record<string, unknown> = { updated_by: updatedBy };
  if (input.question !== undefined) update.question = input.question;
  if (input.answer !== undefined) update.answer = input.answer;
  if (input.category !== undefined) update.category = input.category;
  if (input.displayOrder !== undefined) update.display_order = input.displayOrder;
  if (input.isActive !== undefined) update.is_active = input.isActive;
  const { data, error } = await supabase.from("faqs").update(update).eq("id", id).select(FAQ_COLUMNS).maybeSingle();
  if (error) throw new Error(`Failed to update FAQ: ${error.message}`);
  if (!data) throw new AppError(404, "FAQ not found.", "FAQ_NOT_FOUND");
  return mapFaq(data as FaqRow);
}

export async function archiveFaq(id: string, updatedBy: string): Promise<FaqRecord> {
  return updateFaq(id, { isActive: false }, updatedBy);
}
