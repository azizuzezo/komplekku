import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const agendaDateSchema = z
  .string()
  .regex(datePattern, "Tanggal harus menggunakan format YYYY-MM-DD.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Tanggal tidak valid.");

export const agendaTimeSchema = z
  .string()
  .regex(timePattern, "Waktu harus menggunakan format HH:mm.");

export const agendaViewSchema = z.enum(["upcoming", "past"]);
export type AgendaView = z.infer<typeof agendaViewSchema>;

export const agendaListQuerySchema = z.object({
  view: agendaViewSchema.default("upcoming"),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AgendaListQuery = z.infer<typeof agendaListQuerySchema>;

export const agendaEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  date: agendaDateSchema,
  startTime: agendaTimeSchema,
  endTime: agendaTimeSchema,
  location: z.string().min(1),
  description: z.string().min(1),
  organizer: z.string().min(1),
});

export type AgendaEvent = z.infer<typeof agendaEventSchema>;

export const agendaListResponseSchema = dataEnvelopeSchema(
  z.object({
    view: agendaViewSchema,
    items: z.array(agendaEventSchema),
  }),
);

export type AgendaListResponse = z.infer<typeof agendaListResponseSchema>;

export const agendaDetailResponseSchema = dataEnvelopeSchema(
  z.object({ event: agendaEventSchema }),
);

export type AgendaDetailResponse = z.infer<typeof agendaDetailResponseSchema>;

const agendaWritableFields = {
  title: z.string().trim().min(3).max(160),
  date: agendaDateSchema,
  startTime: agendaTimeSchema,
  endTime: agendaTimeSchema,
  location: z.string().trim().min(2).max(200),
  description: z.string().trim().min(3).max(5_000),
  organizer: z.string().trim().min(2).max(160),
} as const;

export const createAgendaEventInputSchema = z
  .object(agendaWritableFields)
  .strict()
  .refine((input) => input.endTime > input.startTime, {
    path: ["endTime"],
    message: "Waktu selesai harus setelah waktu mulai.",
  });

export type CreateAgendaEventInput = z.infer<typeof createAgendaEventInputSchema>;

export const updateAgendaEventInputSchema = z
  .object(agendaWritableFields)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Kirim setidaknya satu perubahan agenda.",
  })
  .refine(
    (input) =>
      input.startTime === undefined ||
      input.endTime === undefined ||
      input.endTime > input.startTime,
    {
      path: ["endTime"],
      message: "Waktu selesai harus setelah waktu mulai.",
    },
  );

export type UpdateAgendaEventInput = z.infer<typeof updateAgendaEventInputSchema>;

export const agendaMutationResponseSchema = dataEnvelopeSchema(
  z.object({ event: agendaEventSchema }),
);

export type AgendaMutationResponse = z.infer<typeof agendaMutationResponseSchema>;

export const archiveAgendaEventResponseSchema = dataEnvelopeSchema(
  z.object({
    eventId: z.string().uuid(),
    archivedAt: z.string().datetime({ offset: true }),
  }),
);

export type ArchiveAgendaEventResponse = z.infer<typeof archiveAgendaEventResponseSchema>;
