import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { RateFeeCategory, RateFeeItemInput, UpdateRateFeeItemInput } from "../validation/rate-fees.schema";

export type RateFeeItem = {
  id: string;
  category: RateFeeCategory;
  section: string | null;
  itemName: string;
  price1: string;
  price2: string;
  price3: string;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type RateFeeRow = {
  id: string;
  category: RateFeeCategory;
  section: string | null;
  item_name: string;
  price_1: string;
  price_2: string;
  price_3: string;
  display_order: number;
  is_active: boolean;
  updated_at: string;
};

const columns = "id, category, section, item_name, price_1, price_2, price_3, display_order, is_active, updated_at";

function mapRow(row: RateFeeRow): RateFeeItem {
  return {
    id: row.id,
    category: row.category,
    section: row.section,
    itemName: row.item_name,
    price1: row.price_1,
    price2: row.price_2,
    price3: row.price_3,
    displayOrder: row.display_order,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

export async function listRateFeeItems(activeOnly: boolean): Promise<RateFeeItem[]> {
  let query = supabase.from("rate_fee_items").select(columns).order("display_order").order("item_name");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load rate and fee items: ${error.message}`);
  return ((data ?? []) as RateFeeRow[]).map(mapRow);
}

export async function createRateFeeItem(input: RateFeeItemInput): Promise<RateFeeItem> {
  const payload = {
    category: input.category,
    section: input.section || null,
    item_name: input.itemName.trim(),
    price_1: input.price1 ?? "",
    price_2: input.price2 ?? "",
    price_3: input.price3 ?? "",
    display_order: input.displayOrder ?? 0,
    is_active: input.isActive ?? true,
  };
  const { data, error } = await supabase.from("rate_fee_items").insert(payload).select(columns).single();
  if (error) throw new Error(`Failed to create rate and fee item: ${error.message}`);
  if (!data) throw new AppError(500, "Could not create rate and fee item.", "RATE_FEE_CREATE_FAILED");
  return mapRow(data as RateFeeRow);
}

export async function updateRateFeeItem(id: string, input: UpdateRateFeeItemInput): Promise<RateFeeItem> {
  const payload: Record<string, unknown> = {};
  if (input.category !== undefined) payload.category = input.category;
  if (input.section !== undefined) payload.section = input.section || null;
  if (input.itemName !== undefined) payload.item_name = input.itemName.trim();
  if (input.price1 !== undefined) payload.price_1 = input.price1;
  if (input.price2 !== undefined) payload.price_2 = input.price2;
  if (input.price3 !== undefined) payload.price_3 = input.price3;
  if (input.displayOrder !== undefined) payload.display_order = input.displayOrder;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  const { data, error } = await supabase.from("rate_fee_items").update(payload).eq("id", id).select(columns).maybeSingle();
  if (error) throw new Error(`Failed to update rate and fee item: ${error.message}`);
  if (!data) throw new AppError(404, "Rate and fee item not found.", "RATE_FEE_NOT_FOUND");
  return mapRow(data as RateFeeRow);
}

export async function deleteRateFeeItem(id: string): Promise<void> {
  const { data, error } = await supabase.from("rate_fee_items").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(`Failed to delete rate and fee item: ${error.message}`);
  if (!data) throw new AppError(404, "Rate and fee item not found.", "RATE_FEE_NOT_FOUND");
}
