import { createFacilityBookingInputSchema, facilityBookingListQuerySchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { AppRepository, FacilityBookingRecord, FacilityRecord } from "../domain/repository";
import { getAuthContext, requireAnyPermission, requirePermission } from "../lib/authentication";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";

const idParamsSchema = z.object({ id: z.string().uuid() });

function publicFacility(facility: FacilityRecord) {
  return {
    id: facility.id,
    name: facility.name,
    openTime: facility.openTime,
    closeTime: facility.closeTime,
    capacity: facility.capacity,
    rules: facility.rules,
  };
}

function publicBooking(booking: FacilityBookingRecord) {
  return {
    id: booking.id,
    facilityId: booking.facilityId,
    facilityName: booking.facilityName,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    purpose: booking.purpose,
    status: booking.status,
    bookedByName: booking.bookedByName,
    houseCode: booking.houseCode,
    householdDisplayName: booking.householdDisplayName,
    createdAt: booking.createdAt.toISOString(),
  };
}

export async function registerFacilityRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  authenticate: preHandlerHookHandler,
) {
  const readGuards = [authenticate, requirePermission("facility.read")];
  const bookGuards = [authenticate, requirePermission("facility.book")];
  const cancelGuards = [authenticate, requireAnyPermission("facility.book", "facility.manage")];

  app.get("/api/v1/facilities", { preHandler: readGuards }, async (request) => {
    const items = await repository.listFacilities(getAuthContext(request));
    return { data: { items: items.map(publicFacility) }, meta: responseMeta(request) };
  });

  app.get("/api/v1/facility-bookings", { preHandler: readGuards }, async (request) => {
    const query = facilityBookingListQuerySchema.parse(request.query);
    const items = await repository.listFacilityBookings({
      auth: getAuthContext(request),
      facilityId: query.facilityId,
      date: query.date,
      limit: query.limit,
    });
    return { data: { items: items.map(publicBooking) }, meta: responseMeta(request) };
  });

  app.post("/api/v1/facility-bookings", { preHandler: bookGuards }, async (request, reply) => {
    const input = createFacilityBookingInputSchema.parse(request.body);
    const result = await repository.createFacilityBooking({
      auth: getAuthContext(request),
      booking: input,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "FACILITY_NOT_FOUND") {
        throw new AppError(404, "FACILITY_NOT_FOUND", "Fasilitas tidak ditemukan.");
      }
      if (result.outcome === "SLOT_UNAVAILABLE") {
        throw new AppError(409, "SLOT_UNAVAILABLE", "Jadwal ini sudah dipesan. Pilih waktu lain.");
      }
      throw new AppError(409, "HOUSEHOLD_CONTEXT_REQUIRED", "Rumah tangga aktif diperlukan.");
    }
    return reply
      .status(201)
      .send({ data: { booking: publicBooking(result.booking) }, meta: responseMeta(request) });
  });

  app.post("/api/v1/facility-bookings/:id/cancel", { preHandler: cancelGuards }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const result = await repository.cancelFacilityBooking({
      auth: getAuthContext(request),
      bookingId: id,
      now: new Date(),
      audit: { ipAddress: request.ip, userAgent: requestUserAgent(request) },
    });
    if (result.outcome !== "OK") {
      if (result.outcome === "NOT_FOUND") {
        throw new AppError(404, "BOOKING_NOT_FOUND", "Pemesanan tidak ditemukan.");
      }
      throw new AppError(409, "BOOKING_ALREADY_CANCELLED", "Pemesanan sudah dibatalkan sebelumnya.");
    }
    return { data: { booking: publicBooking(result.booking) }, meta: responseMeta(request) };
  });
}
