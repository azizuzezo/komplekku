-- CreateEnum
CREATE TYPE "CameraAccessLevel" AS ENUM ('RESIDENT', 'SECURITY', 'ADMIN_ONLY');

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "EmergencyKind" AS ENUM ('SECURITY', 'MEDICAL', 'FIRE', 'ENVIRONMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('SENT', 'ACKNOWLEDGED', 'RESPONDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('RECEIVED', 'NOTIFIED', 'COLLECTED');

-- CreateEnum
CREATE TYPE "SecurityShiftStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PatrolSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('SECURITY', 'SUSPICIOUS_ACTIVITY', 'DAMAGE', 'NOISE', 'TRAFFIC', 'LOST_ITEM', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "cameras" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "location" VARCHAR(200),
    "access_level" "CameraAccessLevel" NOT NULL DEFAULT 'RESIDENT',
    "status" "CameraStatus" NOT NULL DEFAULT 'ONLINE',
    "last_online_at" TIMESTAMPTZ(3),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergencies" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "kind" "EmergencyKind" NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'SENT',
    "house_label" VARCHAR(160) NOT NULL,
    "note" TEXT,
    "sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ(3),
    "acknowledged_by_user_id" UUID,
    "responding_at" TIMESTAMPTZ(3),
    "resolved_at" TIMESTAMPTZ(3),
    "resolved_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "emergencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "guest_name" VARCHAR(160) NOT NULL,
    "guest_phone" VARCHAR(24),
    "visit_date" DATE NOT NULL,
    "expected_time" TIME(0),
    "vehicle_info" VARCHAR(160),
    "plate" VARCHAR(20),
    "purpose" VARCHAR(200),
    "notes" TEXT,
    "qr_token" VARCHAR(64) NOT NULL,
    "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
    "is_walk_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMPTZ(3),
    "checked_in_by_user_id" UUID,
    "checked_out_at" TIMESTAMPTZ(3),
    "checked_out_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "recipient_name" VARCHAR(160) NOT NULL,
    "courier" VARCHAR(80) NOT NULL,
    "tracking_number" VARCHAR(120),
    "status" "PackageStatus" NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by_user_id" UUID NOT NULL,
    "collected_at" TIMESTAMPTZ(3),
    "collected_by_name" VARCHAR(160),
    "collected_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_shifts" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "officer_user_id" UUID NOT NULL,
    "status" "SecurityShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "security_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_checkpoints" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "qr_token" VARCHAR(64) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patrol_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_sessions" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "officer_user_id" UUID NOT NULL,
    "status" "PatrolSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patrol_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_scans" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "patrol_session_id" UUID NOT NULL,
    "checkpoint_id" UUID NOT NULL,
    "note" TEXT,
    "scanned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrol_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "reporter_user_id" UUID NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(200),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "people_involved" TEXT,
    "action_taken" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cameras_community_id_archived_at_display_order_idx" ON "cameras"("community_id", "archived_at", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "cameras_id_community_id_key" ON "cameras"("id", "community_id");

-- CreateIndex
CREATE INDEX "emergencies_community_id_status_sent_at_idx" ON "emergencies"("community_id", "status", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "emergencies_id_community_id_key" ON "emergencies"("id", "community_id");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_qr_token_key" ON "visitors"("qr_token");

-- CreateIndex
CREATE INDEX "visitors_community_id_household_id_visit_date_idx" ON "visitors"("community_id", "household_id", "visit_date");

-- CreateIndex
CREATE INDEX "visitors_community_id_status_visit_date_idx" ON "visitors"("community_id", "status", "visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_id_community_id_key" ON "visitors"("id", "community_id");

-- CreateIndex
CREATE INDEX "packages_community_id_household_id_status_idx" ON "packages"("community_id", "household_id", "status");

-- CreateIndex
CREATE INDEX "packages_community_id_status_received_at_idx" ON "packages"("community_id", "status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "packages_id_community_id_key" ON "packages"("id", "community_id");

-- CreateIndex
CREATE INDEX "security_shifts_community_id_officer_user_id_status_idx" ON "security_shifts"("community_id", "officer_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "security_shifts_id_community_id_key" ON "security_shifts"("id", "community_id");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_checkpoints_qr_token_key" ON "patrol_checkpoints"("qr_token");

-- CreateIndex
CREATE INDEX "patrol_checkpoints_community_id_archived_at_display_order_idx" ON "patrol_checkpoints"("community_id", "archived_at", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_checkpoints_id_community_id_key" ON "patrol_checkpoints"("id", "community_id");

-- CreateIndex
CREATE INDEX "patrol_sessions_community_id_officer_user_id_status_idx" ON "patrol_sessions"("community_id", "officer_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_sessions_id_community_id_key" ON "patrol_sessions"("id", "community_id");

-- CreateIndex
CREATE INDEX "patrol_scans_community_id_patrol_session_id_idx" ON "patrol_scans"("community_id", "patrol_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_scans_patrol_session_id_checkpoint_id_key" ON "patrol_scans"("patrol_session_id", "checkpoint_id");

-- CreateIndex
CREATE INDEX "incidents_community_id_status_occurred_at_idx" ON "incidents"("community_id", "status", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_id_community_id_key" ON "incidents"("id", "community_id");

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_acknowledged_by_user_id_fkey" FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_household_id_community_id_fkey" FOREIGN KEY ("household_id", "community_id") REFERENCES "households"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_checked_in_by_user_id_fkey" FOREIGN KEY ("checked_in_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_checked_out_by_user_id_fkey" FOREIGN KEY ("checked_out_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_household_id_community_id_fkey" FOREIGN KEY ("household_id", "community_id") REFERENCES "households"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_collected_by_user_id_fkey" FOREIGN KEY ("collected_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_shifts" ADD CONSTRAINT "security_shifts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_shifts" ADD CONSTRAINT "security_shifts_officer_user_id_fkey" FOREIGN KEY ("officer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_checkpoints" ADD CONSTRAINT "patrol_checkpoints_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_sessions" ADD CONSTRAINT "patrol_sessions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_sessions" ADD CONSTRAINT "patrol_sessions_officer_user_id_fkey" FOREIGN KEY ("officer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_scans" ADD CONSTRAINT "patrol_scans_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_scans" ADD CONSTRAINT "patrol_scans_patrol_session_id_community_id_fkey" FOREIGN KEY ("patrol_session_id", "community_id") REFERENCES "patrol_sessions"("id", "community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_scans" ADD CONSTRAINT "patrol_scans_checkpoint_id_community_id_fkey" FOREIGN KEY ("checkpoint_id", "community_id") REFERENCES "patrol_checkpoints"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
