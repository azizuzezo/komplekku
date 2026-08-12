import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const cashTransactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export const cashVisibilitySchema = z.enum(["PUBLIC_TO_RESIDENTS", "ADMIN_ONLY"]);

export type CashTransactionType = z.infer<typeof cashTransactionTypeSchema>;
export type CashVisibility = z.infer<typeof cashVisibilitySchema>;

export const createCashTransactionInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus menggunakan format YYYY-MM-DD."),
    category: z.string().trim().min(2).max(120),
    description: z.string().trim().min(3).max(1000),
    amount: z.number().int().positive(),
    type: cashTransactionTypeSchema,
    visibility: cashVisibilitySchema.default("PUBLIC_TO_RESIDENTS"),
  })
  .strict();

export type CreateCashTransactionInput = z.infer<typeof createCashTransactionInputSchema>;

export const cashTransactionListQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const cashTransactionSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().int(),
  type: cashTransactionTypeSchema,
  visibility: cashVisibilitySchema,
  recordedByName: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});

export type CashTransaction = z.infer<typeof cashTransactionSchema>;

export const cashTransactionListResponseSchema = dataEnvelopeSchema(
  z.object({
    items: z.array(cashTransactionSchema),
    openingBalance: z.number().int(),
    totalIncome: z.number().int().nonnegative(),
    totalExpense: z.number().int().nonnegative(),
    closingBalance: z.number().int(),
  }),
);

export const cashTransactionMutationResponseSchema = dataEnvelopeSchema(
  z.object({ transaction: cashTransactionSchema }),
);

export type CashTransactionListResponse = z.infer<typeof cashTransactionListResponseSchema>;
export type CashTransactionMutationResponse = z.infer<typeof cashTransactionMutationResponseSchema>;
