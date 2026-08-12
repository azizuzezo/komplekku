-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CashTransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CashVisibility" AS ENUM ('PUBLIC_TO_RESIDENTS', 'ADMIN_ONLY');

-- CreateTable
CREATE TABLE "dues_types" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "default_amount" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dues_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "dues_type_id" UUID NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "amount" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "waived_at" TIMESTAMPTZ(3),
    "waived_by_user_id" UUID,
    "waived_reason" TEXT,
    "paid_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "submitted_by_user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_at" DATE NOT NULL,
    "note" VARCHAR(300) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by_user_id" UUID,
    "verified_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "receipt_number" VARCHAR(40),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "category" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CashTransactionType" NOT NULL,
    "visibility" "CashVisibility" NOT NULL DEFAULT 'PUBLIC_TO_RESIDENTS',
    "recorded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dues_types_community_id_is_active_idx" ON "dues_types"("community_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "dues_types_id_community_id_key" ON "dues_types"("id", "community_id");

-- CreateIndex
CREATE INDEX "invoices_community_id_status_due_date_idx" ON "invoices"("community_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "invoices_community_id_household_id_idx" ON "invoices"("community_id", "household_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_id_community_id_key" ON "invoices"("id", "community_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_household_id_dues_type_id_period_key" ON "invoices"("household_id", "dues_type_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");

-- CreateIndex
CREATE INDEX "payments_community_id_status_idx" ON "payments"("community_id", "status");

-- CreateIndex
CREATE INDEX "payments_community_id_invoice_id_idx" ON "payments"("community_id", "invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_id_community_id_key" ON "payments"("id", "community_id");

-- CreateIndex
CREATE INDEX "cash_transactions_community_id_date_idx" ON "cash_transactions"("community_id", "date");

-- CreateIndex
CREATE INDEX "cash_transactions_community_id_visibility_date_idx" ON "cash_transactions"("community_id", "visibility", "date");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_id_community_id_key" ON "cash_transactions"("id", "community_id");

-- AddForeignKey
ALTER TABLE "dues_types" ADD CONSTRAINT "dues_types_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_household_id_community_id_fkey" FOREIGN KEY ("household_id", "community_id") REFERENCES "households"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_dues_type_id_community_id_fkey" FOREIGN KEY ("dues_type_id", "community_id") REFERENCES "dues_types"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_waived_by_user_id_fkey" FOREIGN KEY ("waived_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_community_id_fkey" FOREIGN KEY ("invoice_id", "community_id") REFERENCES "invoices"("id", "community_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
