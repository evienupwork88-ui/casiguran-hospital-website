import { z } from "zod";

export const rateFeeCategorySchema = z.enum(["pharmacy", "dental", "himd", "laboratory", "radiology"]);

export const rateFeeItemSchema = z.object({
  category: rateFeeCategorySchema,
  section: z.string().trim().max(100).optional().or(z.literal("")),
  itemName: z.string().trim().min(1, "Item name is required").max(200),
  price1: z.string().trim().max(50).optional().default(""),
  price2: z.string().trim().max(50).optional().default(""),
  price3: z.string().trim().max(50).optional().default(""),
  displayOrder: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateRateFeeItemSchema = rateFeeItemSchema.partial();

export type RateFeeCategory = z.infer<typeof rateFeeCategorySchema>;
export type RateFeeItemInput = z.infer<typeof rateFeeItemSchema>;
export type UpdateRateFeeItemInput = z.infer<typeof updateRateFeeItemSchema>;
