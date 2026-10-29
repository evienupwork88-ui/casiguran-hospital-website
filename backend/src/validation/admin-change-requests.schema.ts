import { z } from "zod";
import { sanitizePlainText } from "../utils/sanitize-plain-text";

export const rejectAdminChangeRequestSchema = z.object({
  reason: z.string().max(800).transform(sanitizePlainText).pipe(z.string().max(200)),
});

export type RejectAdminChangeRequestInput = z.infer<typeof rejectAdminChangeRequestSchema>;
