import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";
import { occupancyStatusSchema } from "./household";

export const createHouseInputSchema = z
  .object({
    code: z.string().trim().min(1).max(24),
    block: z.string().trim().min(1).max(16),
    number: z.string().trim().min(1).max(16),
    occupancyStatus: occupancyStatusSchema.default("VACANT"),
  })
  .strict();

export type CreateHouseInput = z.infer<typeof createHouseInputSchema>;

export const houseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  block: z.string().min(1),
  number: z.string().min(1),
  occupancyStatus: occupancyStatusSchema,
  addressLabel: z.string().min(1),
  hasHousehold: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

export type House = z.infer<typeof houseSchema>;

export const houseListResponseSchema = dataEnvelopeSchema(z.object({ items: z.array(houseSchema) }));

export const houseMutationResponseSchema = dataEnvelopeSchema(z.object({ house: houseSchema }));

export type HouseListResponse = z.infer<typeof houseListResponseSchema>;
export type HouseMutationResponse = z.infer<typeof houseMutationResponseSchema>;
