import { z } from "zod";

export const responseMetaSchema = z.object({
  requestId: z.string().min(1).optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
  total: z.number().int().nonnegative().optional(),
  nextCursor: z.string().uuid().optional(),
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export function dataEnvelopeSchema<TData extends z.ZodType>(data: TData) {
  return z.object({
    data,
    meta: responseMetaSchema,
  });
}
