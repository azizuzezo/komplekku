-- CreateEnum
CREATE TYPE "ForumChannelKind" AS ENUM ('SYSTEM', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ForumMemberStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "forum_channels"
    ADD COLUMN "kind" "ForumChannelKind" NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN "description" VARCHAR(500),
    ADD COLUMN "created_by_user_id" UUID;

-- AlterTable
ALTER TABLE "forum_messages"
    ADD COLUMN "reply_to_message_id" UUID,
    ADD COLUMN "edited_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "forum_channel_members" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "ForumMemberStatus" NOT NULL DEFAULT 'PENDING',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "invited_by_user_id" UUID,
    "invited_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(3),

    CONSTRAINT "forum_channel_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forum_channels_community_id_kind_idx" ON "forum_channels"("community_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "forum_channel_members_channel_id_user_id_key" ON "forum_channel_members"("channel_id", "user_id");

-- CreateIndex
CREATE INDEX "forum_channel_members_community_id_user_id_status_idx" ON "forum_channel_members"("community_id", "user_id", "status");

-- AddForeignKey
ALTER TABLE "forum_channels" ADD CONSTRAINT "forum_channels_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_messages" ADD CONSTRAINT "forum_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "forum_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_channel_members" ADD CONSTRAINT "forum_channel_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_channel_members" ADD CONSTRAINT "forum_channel_members_channel_id_community_id_fkey" FOREIGN KEY ("channel_id", "community_id") REFERENCES "forum_channels"("id", "community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_channel_members" ADD CONSTRAINT "forum_channel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_channel_members" ADD CONSTRAINT "forum_channel_members_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
