"use client";

import type { CashTransaction } from "@komplekku/contracts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { cashKeys, listCashTransactions } from "./cash-api";

function currentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatRupiah(amount: number) {
  const formatted = `Rp${new Intl.NumberFormat("id-ID").format(Math.abs(amount))}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

function formatCashDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CashTransactionRow({ transaction }: { transaction: CashTransaction }) {
  const isIncome = transaction.type === "INCOME";

  return (
    <div className="cash-transaction-row">
      <div>
        <p className="cash-transaction-row__title">
          {transaction.category}
          {transaction.visibility === "ADMIN_ONLY" && (
            <span className="status-label status-label--warning"> · Khusus pengurus</span>
          )}
        </p>
        <p className="cash-transaction-row__meta">
          {formatCashDate(transaction.date)} · {transaction.description} · dicatat oleh{" "}
          {transaction.recordedByName}
        </p>
      </div>
      <p
        className={`cash-transaction-row__amount ${
          isIncome
            ? "cash-transaction-row__amount--income"
            : "cash-transaction-row__amount--expense"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatRupiah(transaction.amount)}
      </p>
    </div>
  );
}

export function CashLedgerSummary() {
  const [period, setPeriod] = useState(currentPeriod());

  const ledgerQuery = useQuery({
    queryKey: cashKeys.ledger(period),
    queryFn: () => listCashTransactions(period),
  });

  return (
    <div className="cash-ledger-summary">
      <section className="cash-period-picker" aria-labelledby="cash-period-heading">
        <div className="section-heading">
          <h2 id="cash-period-heading">Periode</h2>
        </div>
        <div className="field">
          <label htmlFor="cash-period">Bulan</label>
          <input
            className="input"
            id="cash-period"
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
        </div>
      </section>

      {ledgerQuery.isPending && <AdminQueueSkeleton rows={2} />}

      {ledgerQuery.isError &&
        (() => {
          const state = getRequestState(ledgerQuery.error);
          if (state === "unauthorized") {
            return (
              <StatePanel
                kind="unauthorized"
                title="Sesi sudah berakhir"
                description="Masuk kembali untuk melihat transaksi kas."
                actionHref="/masuk"
                actionLabel="Masuk"
              />
            );
          }
          if (state === "forbidden") {
            return (
              <StatePanel
                kind="forbidden"
                title="Transaksi kas tidak dapat diakses"
                description="Izin akunmu tidak mencakup transaksi kas."
              />
            );
          }
          if (state === "offline") {
            return (
              <StatePanel
                kind="offline"
                title="Kamu sedang offline"
                description="Transaksi kas belum dapat diperbarui."
                onRetry={() => void ledgerQuery.refetch()}
              />
            );
          }
          return (
            <StatePanel
              kind="error"
              title="Transaksi kas belum bisa dimuat"
              description="Terjadi kendala saat mengambil data kas."
              onRetry={() => void ledgerQuery.refetch()}
            />
          );
        })()}

      {ledgerQuery.isSuccess && (
        <>
          <div className="cash-summary-grid">
            <article className="cash-summary-card">
              <p className="cash-summary-card__label">Saldo awal</p>
              <p className="cash-summary-card__value">
                {formatRupiah(ledgerQuery.data.data.openingBalance)}
              </p>
            </article>
            <article className="cash-summary-card cash-summary-card--income">
              <p className="cash-summary-card__label">Pemasukan</p>
              <p className="cash-summary-card__value">
                {formatRupiah(ledgerQuery.data.data.totalIncome)}
              </p>
            </article>
            <article className="cash-summary-card cash-summary-card--expense">
              <p className="cash-summary-card__label">Pengeluaran</p>
              <p className="cash-summary-card__value">
                {formatRupiah(ledgerQuery.data.data.totalExpense)}
              </p>
            </article>
            <article className="cash-summary-card">
              <p className="cash-summary-card__label">Saldo akhir</p>
              <p className="cash-summary-card__value">
                {formatRupiah(ledgerQuery.data.data.closingBalance)}
              </p>
            </article>
          </div>

          <section className="cash-transaction-section" aria-labelledby="cash-transaction-heading">
            <div className="section-heading">
              <h2 id="cash-transaction-heading">Transaksi</h2>
            </div>
            {ledgerQuery.data.data.items.length === 0 ? (
              <StatePanel
                kind="empty"
                title="Belum ada transaksi kas pada periode ini"
                description="Transaksi kas yang tercatat pada periode ini akan muncul di sini."
              />
            ) : (
              <div className="cash-transaction-list">
                {ledgerQuery.data.data.items.map((transaction) => (
                  <CashTransactionRow transaction={transaction} key={transaction.id} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function CashTransparencyView() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("cash.read") ?? false;

  if (meQuery.isPending) return <AdminQueueSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka transparansi kas."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Izin akun belum dapat diperiksa."
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Izin akun belum bisa diperiksa"
        description="Terjadi kendala saat mengambil informasi akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Transparansi kas tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat transaksi kas."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  return <CashLedgerSummary />;
}
