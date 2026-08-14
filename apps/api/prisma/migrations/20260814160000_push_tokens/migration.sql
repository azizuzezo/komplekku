CREATE TABLE "push_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "platform" VARCHAR(32) NOT NULL DEFAULT 'ANDROID',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

CREATE INDEX "push_tokens_community_id_user_id_idx" ON "push_tokens"("community_id", "user_id");

ALTER TABLE "push_tokens"
ADD CONSTRAINT "push_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "push_tokens"
ADD CONSTRAINT "push_tokens_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
