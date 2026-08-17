-- CreateTable
CREATE TABLE "forum_channels" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "rt_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_messages" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "forum_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forum_channels_community_id_rt_id_idx" ON "forum_channels"("community_id", "rt_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_channels_id_community_id_key" ON "forum_channels"("id", "community_id");

-- CreateIndex
CREATE INDEX "forum_messages_community_id_channel_id_created_at_idx" ON "forum_messages"("community_id", "channel_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "forum_messages_id_community_id_key" ON "forum_messages"("id", "community_id");

-- AddForeignKey
ALTER TABLE "forum_channels" ADD CONSTRAINT "forum_channels_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_channels" ADD CONSTRAINT "forum_channels_rt_id_community_id_fkey" FOREIGN KEY ("rt_id", "community_id") REFERENCES "rts"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_messages" ADD CONSTRAINT "forum_messages_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_messages" ADD CONSTRAINT "forum_messages_channel_id_community_id_fkey" FOREIGN KEY ("channel_id", "community_id") REFERENCES "forum_channels"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_messages" ADD CONSTRAINT "forum_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
