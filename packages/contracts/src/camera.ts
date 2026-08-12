import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const cameraAccessLevelSchema = z.enum(["RESIDENT", "SECURITY", "ADMIN_ONLY"]);
export const cameraStatusSchema = z.enum(["ONLINE", "OFFLINE"]);

export type CameraAccessLevel = z.infer<typeof cameraAccessLevelSchema>;
export type CameraStatus = z.infer<typeof cameraStatusSchema>;

export const createCameraInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    location: z.string().trim().max(200).optional(),
    accessLevel: cameraAccessLevelSchema,
  })
  .strict();

export type CreateCameraInput = z.infer<typeof createCameraInputSchema>;

export const updateCameraInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    location: z.string().trim().max(200).nullable().optional(),
    accessLevel: cameraAccessLevelSchema.optional(),
    status: cameraStatusSchema.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan kamera.",
  });

export type UpdateCameraInput = z.infer<typeof updateCameraInputSchema>;

export const cameraSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  location: z.string().nullable(),
  accessLevel: cameraAccessLevelSchema,
  status: cameraStatusSchema,
  lastOnlineAt: z.string().datetime({ offset: true }).nullable(),
});

export type Camera = z.infer<typeof cameraSchema>;

export const cameraListResponseSchema = dataEnvelopeSchema(
  z.object({ items: z.array(cameraSchema) }),
);

export const cameraMutationResponseSchema = dataEnvelopeSchema(
  z.object({ camera: cameraSchema }),
);

export const streamTicketResponseSchema = dataEnvelopeSchema(
  z.object({
    cameraId: z.string().uuid(),
    mode: z.enum(["mock", "rtsp"]),
    status: cameraStatusSchema,
    ticket: z.string().min(1).nullable(),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
    watermark: z.object({
      label: z.string().min(1),
      viewerName: z.string().min(1),
      generatedAt: z.string().datetime({ offset: true }),
    }),
  }),
);

export type CameraListResponse = z.infer<typeof cameraListResponseSchema>;
export type CameraMutationResponse = z.infer<typeof cameraMutationResponseSchema>;
export type StreamTicketResponse = z.infer<typeof streamTicketResponseSchema>;
