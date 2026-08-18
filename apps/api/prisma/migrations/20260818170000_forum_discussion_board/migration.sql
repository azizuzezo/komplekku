-- CreateEnum
CREATE TYPE "ForumPostCategory" AS ENUM ('QUESTION', 'SUGGESTION', 'INFORMATION', 'ENVIRONMENT', 'ACTIVITY');

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "category" "ForumPostCategory" NOT NULL DEFAULT 'INFORMATION',
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_post_replies" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "reply_to_reply_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "forum_post_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_post_likes" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_reply_likes" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "reply_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_reply_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forum_posts_id_community_id_key" ON "forum_posts"("id", "community_id");

-- CreateIndex
CREATE INDEX "forum_posts_community_id_created_at_idx" ON "forum_posts"("community_id", "created_at");

-- CreateIndex
CREATE INDEX "forum_posts_community_id_category_created_at_idx" ON "forum_posts"("community_id", "category", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "forum_post_replies_id_community_id_key" ON "forum_post_replies"("id", "community_id");

-- CreateIndex
CREATE INDEX "forum_post_replies_community_id_post_id_created_at_idx" ON "forum_post_replies"("community_id", "post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "forum_post_likes_post_id_user_id_key" ON "forum_post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "forum_post_likes_community_id_user_id_idx" ON "forum_post_likes"("community_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_reply_likes_reply_id_user_id_key" ON "forum_reply_likes"("reply_id", "user_id");

-- CreateIndex
CREATE INDEX "forum_reply_likes_community_id_user_id_idx" ON "forum_reply_likes"("community_id", "user_id");

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_replies" ADD CONSTRAINT "forum_post_replies_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_replies" ADD CONSTRAINT "forum_post_replies_post_id_community_id_fkey" FOREIGN KEY ("post_id", "community_id") REFERENCES "forum_posts"("id", "community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_replies" ADD CONSTRAINT "forum_post_replies_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_replies" ADD CONSTRAINT "forum_post_replies_reply_to_reply_id_fkey" FOREIGN KEY ("reply_to_reply_id") REFERENCES "forum_post_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_post_id_community_id_fkey" FOREIGN KEY ("post_id", "community_id") REFERENCES "forum_posts"("id", "community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_reply_likes" ADD CONSTRAINT "forum_reply_likes_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_reply_likes" ADD CONSTRAINT "forum_reply_likes_reply_id_community_id_fkey" FOREIGN KEY ("reply_id", "community_id") REFERENCES "forum_post_replies"("id", "community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_reply_likes" ADD CONSTRAINT "forum_reply_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
