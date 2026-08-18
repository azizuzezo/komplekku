-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('INFO', 'EVENT');

-- AlterTable
ALTER TABLE "announcements"
    ADD COLUMN "category" "AnnouncementCategory" NOT NULL DEFAULT 'INFO',
    ADD COLUMN "cover_image_url" TEXT;

-- CreateIndex
CREATE INDEX "announcements_community_id_category_published_at_idx" ON "announcements"("community_id", "category", "published_at");
