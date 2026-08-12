CREATE TYPE "NotificationPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "archived_by_user_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "event_date" DATE NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "organizer" VARCHAR(160) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "events_time_order_check" CHECK ("end_time" > "start_time")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" UUID,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "events_id_community_id_key" ON "events"("id", "community_id");
CREATE INDEX "events_community_id_archived_at_event_date_start_time_idx"
ON "events"("community_id", "archived_at", "event_date", "start_time");

CREATE UNIQUE INDEX "notifications_id_community_id_key"
ON "notifications"("id", "community_id");
CREATE INDEX "notifications_community_id_user_id_read_at_created_at_idx"
ON "notifications"("community_id", "user_id", "read_at", "created_at");

ALTER TABLE "events"
ADD CONSTRAINT "events_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "events"
ADD CONSTRAINT "events_archived_by_user_id_fkey"
FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
