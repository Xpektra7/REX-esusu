import { z } from "zod";

export const payDebtSchema = z.object({
  amount: z.coerce.number().int().positive().optional(),
});
