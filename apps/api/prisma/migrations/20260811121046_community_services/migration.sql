-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('STREET_LIGHT', 'TRASH', 'DRAINAGE', 'SECURITY', 'FACILITY', 'CLEANLINESS', 'NOISE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LetterRequestStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'READY');

-- CreateEnum
CREATE TYPE "FacilityBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "reporter_user_id" UUID NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(200),
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_updates" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "note" TEXT,
    "actor_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_types" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "letter_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_requests" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "requester_user_id" UUID NOT NULL,
    "letter_type_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "LetterRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "ready_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "letter_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "open_time" VARCHAR(5) NOT NULL,
    "close_time" VARCHAR(5) NOT NULL,
    "capacity" INTEGER,
    "rules" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_bookings" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "booked_by_user_id" UUID NOT NULL,
    "purpose" VARCHAR(200),
    "booking_date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "status" "FacilityBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "facility_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_community_id_status_created_at_idx" ON "reports"("community_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "reports_community_id_household_id_idx" ON "reports"("community_id", "household_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_id_community_id_key" ON "reports"("id", "community_id");

-- CreateIndex
CREATE INDEX "report_updates_community_id_report_id_created_at_idx" ON "report_updates"("community_id", "report_id", "created_at");

-- CreateIndex
CREATE INDEX "letter_types_community_id_is_active_display_order_idx" ON "letter_types"("community_id", "is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "letter_types_id_community_id_key" ON "letter_types"("id", "community_id");

-- CreateIndex
CREATE INDEX "letter_requests_community_id_status_created_at_idx" ON "letter_requests"("community_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "letter_requests_community_id_household_id_idx" ON "letter_requests"("community_id", "household_id");

-- CreateIndex
CREATE UNIQUE INDEX "letter_requests_id_community_id_key" ON "letter_requests"("id", "community_id");

-- CreateIndex
CREATE INDEX "facilities_community_id_is_active_idx" ON "facilities"("community_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_id_community_id_key" ON "facilities"("id", "community_id");

-- CreateIndex
CREATE INDEX "facility_bookings_community_id_facility_id_booking_date_sta_idx" ON "facility_bookings"("community_id", "facility_id", "booking_date", "status");

-- CreateIndex
CREATE INDEX "facility_bookings_community_id_household_id_idx" ON "facility_bookings"("community_id", "household_id");

-- CreateIndex
CREATE UNIQUE INDEX "facility_bookings_id_community_id_key" ON "facility_bookings"("id", "community_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_household_id_community_id_fkey" FOREIGN KEY ("household_id", "community_id") REFERENCES "households"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_updates" ADD CONSTRAINT "report_updates_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_updates" ADD CONSTRAINT "report_updates_report_id_community_id_fkey" FOREIGN KEY ("report_id", "community_id") REFERENCES "reports"("id", "community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_updates" ADD CONSTRAINT "report_updates_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_types" ADD CONSTRAINT "letter_types_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_requests" ADD CONSTRAINT "letter_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_requests" ADD CONSTRAINT "letter_requests_household_id_community_id_fkey" FOREIGN KEY ("household_id", "community_id") REFERENCES "households"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_requests" ADD CONSTRAINT "letter_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_requests" ADD CONSTRAINT "letter_requests_letter_type_id_community_id_fkey" FOREIGN KEY ("letter_type_id", "community_id") REFERENCES "letter_types"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_requests" ADD CONSTRAINT "letter_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_facility_id_community_id_fkey" FOREIGN KEY ("facility_id", "community_id") REFERENCES "facilities"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_household_id_community_id_fkey" FOREIGN KEY ("household_id", "community_id") REFERENCES "households"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_booked_by_user_id_fkey" FOREIGN KEY ("booked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
