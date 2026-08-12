-- Preserve who rejected a resident claim without overloading approval fields.
ALTER TABLE "residents"
ADD COLUMN "rejected_at" TIMESTAMPTZ(3),
ADD COLUMN "rejected_by_user_id" UUID;

ALTER TABLE "residents"
ADD CONSTRAINT "residents_rejected_by_user_id_fkey"
FOREIGN KEY ("rejected_by_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Make tenant ownership part of the database-level house references.
CREATE UNIQUE INDEX "households_house_id_community_id_key"
ON "households"("house_id", "community_id");

ALTER TABLE "households"
DROP CONSTRAINT "households_house_id_fkey";

ALTER TABLE "households"
ADD CONSTRAINT "households_house_id_community_id_fkey"
FOREIGN KEY ("house_id", "community_id") REFERENCES "houses"("id", "community_id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "residents"
DROP CONSTRAINT "residents_requested_house_id_fkey";

ALTER TABLE "residents"
ADD CONSTRAINT "residents_requested_house_id_community_id_fkey"
FOREIGN KEY ("requested_house_id", "community_id") REFERENCES "houses"("id", "community_id")
ON DELETE RESTRICT ON UPDATE CASCADE;
