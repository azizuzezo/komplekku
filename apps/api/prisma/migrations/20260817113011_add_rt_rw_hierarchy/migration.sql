-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "rw_label" VARCHAR(60);

-- AlterTable
ALTER TABLE "houses" ADD COLUMN     "rt_id" UUID;

-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "rt_id" UUID;

-- CreateTable
CREATE TABLE "rts" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "rts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rts_community_id_deleted_at_idx" ON "rts"("community_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "rts_community_id_code_key" ON "rts"("community_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "rts_id_community_id_key" ON "rts"("id", "community_id");

-- CreateIndex
CREATE INDEX "houses_community_id_rt_id_idx" ON "houses"("community_id", "rt_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_rt_id_community_id_fkey" FOREIGN KEY ("rt_id", "community_id") REFERENCES "rts"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rts" ADD CONSTRAINT "rts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_rt_id_community_id_fkey" FOREIGN KEY ("rt_id", "community_id") REFERENCES "rts"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;
