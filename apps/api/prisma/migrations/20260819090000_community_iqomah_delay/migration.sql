ALTER TABLE "communities"
ADD COLUMN "iqomah_delay_minutes" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "communities"
ADD CONSTRAINT "communities_iqomah_delay_minutes_check"
CHECK ("iqomah_delay_minutes" BETWEEN 1 AND 60);
