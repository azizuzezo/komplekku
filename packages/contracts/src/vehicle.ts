import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const vehicleTypeSchema = z.enum(["CAR", "MOTORCYCLE", "BICYCLE", "OTHER"]);
export const vehicleStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export type VehicleType = z.infer<typeof vehicleTypeSchema>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;

const vehiclePlateSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .regex(/^[A-Za-z0-9 -]+$/, "Plat hanya boleh berisi huruf, angka, spasi, dan tanda hubung.")
  .refine((value) => value.replace(/[^A-Za-z0-9]/g, "").length >= 2, {
    message: "Plat harus memiliki setidaknya dua huruf atau angka.",
  });

const vehicleWritableFields = {
  type: vehicleTypeSchema,
  plate: vehiclePlateSchema.nullable(),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80).nullable(),
  color: z.string().trim().min(1).max(60),
  ownerLabel: z.string().trim().min(2).max(160),
  ownerResidentId: z.string().uuid().nullable(),
  status: vehicleStatusSchema,
} as const;

function plateRequiredForMotorVehicle(input: { type?: VehicleType; plate?: string | null }) {
  return !(
    (input.type === "CAR" || input.type === "MOTORCYCLE") &&
    (input.plate === null || input.plate === undefined)
  );
}

export const createVehicleInputSchema = z
  .object({
    ...vehicleWritableFields,
    status: vehicleStatusSchema.default("ACTIVE"),
  })
  .strict()
  .refine(plateRequiredForMotorVehicle, {
    path: ["plate"],
    message: "Plat wajib diisi untuk mobil dan motor.",
  });

export const updateVehicleInputSchema = z
  .object(vehicleWritableFields)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan kendaraan.",
  });

export type CreateVehicleInput = z.infer<typeof createVehicleInputSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleInputSchema>;

export const vehicleSchema = z.object({
  id: z.string().uuid(),
  type: vehicleTypeSchema,
  plate: z.string().min(1).nullable(),
  brand: z.string().min(1),
  model: z.string().min(1).nullable(),
  color: z.string().min(1),
  ownerLabel: z.string().min(1),
  ownerResidentId: z.string().uuid().nullable(),
  status: vehicleStatusSchema,
  houseCode: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export const vehicleListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(vehicleSchema) }),
);

export const vehicleMutationResponseSchema = dataEnvelopeSchema(
  z.object({ vehicle: vehicleSchema }),
);

export const archiveVehicleResponseSchema = dataEnvelopeSchema(
  z.object({
    vehicleId: z.string().uuid(),
    archivedAt: z.string().datetime({ offset: true }),
  }),
);

export const vehicleSearchQuerySchema = z
  .object({
    q: vehiclePlateSchema,
  })
  .strict();

export const vehicleSearchResultSchema = z.object({
  vehicleId: z.string().uuid(),
  type: vehicleTypeSchema,
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1).nullable(),
  color: z.string().min(1),
  ownerLabel: z.string().min(1),
  houseCode: z.string().min(1),
  status: vehicleStatusSchema,
});

export const vehicleSearchResponseSchema = dataEnvelopeSchema(
  z.object({ result: vehicleSearchResultSchema.nullable() }),
);

export type VehicleListResponse = z.infer<typeof vehicleListResponseSchema>;
export type VehicleMutationResponse = z.infer<typeof vehicleMutationResponseSchema>;
export type ArchiveVehicleResponse = z.infer<typeof archiveVehicleResponseSchema>;
export type VehicleSearchResponse = z.infer<typeof vehicleSearchResponseSchema>;
