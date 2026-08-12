ALTER TABLE "users"
ADD COLUMN "allow_resident_contact" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'BICYCLE', 'OTHER');
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "owner_resident_id" UUID,
    "type" "VehicleType" NOT NULL,
    "plate" VARCHAR(20),
    "plate_normalized" VARCHAR(20),
    "brand" VARCHAR(80) NOT NULL,
    "model" VARCHAR(80),
    "color" VARCHAR(60) NOT NULL,
    "owner_label" VARCHAR(160) NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vehicles_plate_required_check" CHECK (
      "type" NOT IN ('CAR', 'MOTORCYCLE') OR "plate_normalized" IS NOT NULL
    ),
    CONSTRAINT "vehicles_plate_normalized_check" CHECK (
      ("plate" IS NULL AND "plate_normalized" IS NULL)
      OR (
        "plate" IS NOT NULL
        AND "plate_normalized" = UPPER(REGEXP_REPLACE("plate", '[^A-Za-z0-9]', '', 'g'))
      )
    ),
    CONSTRAINT "vehicles_archive_status_check" CHECK (
      "archived_at" IS NULL OR "status" = 'INACTIVE'
    )
);

CREATE UNIQUE INDEX "vehicles_id_community_id_key"
ON "vehicles"("id", "community_id");

CREATE INDEX "vehicles_community_id_household_id_archived_at_idx"
ON "vehicles"("community_id", "household_id", "archived_at");

CREATE INDEX "vehicles_community_id_plate_normalized_archived_at_idx"
ON "vehicles"("community_id", "plate_normalized", "archived_at");

CREATE UNIQUE INDEX "vehicles_community_id_active_plate_key"
ON "vehicles"("community_id", "plate_normalized")
WHERE "archived_at" IS NULL AND "plate_normalized" IS NOT NULL;

ALTER TABLE "vehicles"
ADD CONSTRAINT "vehicles_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehicles"
ADD CONSTRAINT "vehicles_household_id_community_id_fkey"
FOREIGN KEY ("household_id", "community_id")
REFERENCES "households"("id", "community_id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehicles"
ADD CONSTRAINT "vehicles_owner_resident_id_community_id_fkey"
FOREIGN KEY ("owner_resident_id", "community_id")
REFERENCES "residents"("id", "community_id")
ON DELETE RESTRICT ON UPDATE CASCADE;
