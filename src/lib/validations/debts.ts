import { z } from "zod";

export const payDebtSchema = z.object({
  amount: z.number().positive().optional(),
});
