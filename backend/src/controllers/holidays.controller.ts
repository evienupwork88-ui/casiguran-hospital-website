import type { Request, Response } from "express";
import { z } from "zod";
import { listPhilippinePublicHolidays } from "../services/holidays.service";
import { AppError } from "../utils/AppError";

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function listPublicHolidays(req: Request, res: Response) {
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    throw new AppError(400, "A valid year between 2000 and 2100 is required", "INVALID_HOLIDAY_YEAR");
  }

  const items = await listPhilippinePublicHolidays(parsedQuery.data.year);
  res.status(200).json({ items });
}
