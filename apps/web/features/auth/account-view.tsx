"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardCheck,
  Edit3,
  LogOut,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AccountSkeleton } from "@/components/ui/content-skeleton";
import { BrandMark } from "@/components/ui/brand-mark";
import { StatePanel } from "@/components/ui/state-panel";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getMe, logout, updateProfile } from "./auth-api";
import {
  addHouseholdMember,
  getCurrentHousehold,
  removeHouseholdMember,
} from "@/features/household/household-api";

const residentStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  PENDING: "Menunggu verifikasi",
  REJECTED: "Ditolak",
  SUSPENDED: "Ditangguhkan",
  MOVED_OUT: "Sudah pindah",
};

const relationshipLabels: Record<string, string> = {
  HEAD: "Kepala Keluarga",
  SPOUSE: "Suami / Istri",
  CHILD: "Anak",
  PARENT: "Orang Tua",
  RELATIVE: "Kerabat",
  TENANT: "Penyewa",
  OTHER: "Lainnya",
};

export function AccountView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const householdQuery = useQuery({
    queryKey: ["household"],
    queryFn: getCurrentHousehold,
    enabled: Boolean(meQuery.data?.data.currentContext),
  });

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  // Family Members Management State
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [familyInputName, setFamilyInputName] = useState("");
  const [familyInputPhone, setFamilyInputPhone] = useState("");
  const [familyInputRelation, setFamilyInputRelation] = useState("SPOUSE");
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const addMemberMutation = useMutation({
    mutationFn: addHouseholdMember,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["household"] });
      setIsAddingFamily(false);
      setFamilyInputName("");
      setFamilyInputPhone("");
      setFamilyInputRelation("SPOUSE");
      setAddMemberError(null);
    },
    onError(err) {
      setAddMemberError(
        err instanceof ApiError ? err.message : "Gagal menambah anggota. Coba lagi.",
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeHouseholdMember,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess() {
      queryClient.clear();
      router.replace("/masuk");
      router.refresh();
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => updateProfile({ displayName: name }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditingName(false);
      setNameError(null);
    },
    onError(err) {
      if (err instanceof ApiError) {
        setNameError(err.message);
      } else {
        setNameError("Gagal memperbarui nama. Coba lagi.");
      }
    },
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      setNameError("Nama minimal 2 karakter.");
      return;
    }
    updateNameMutation.mutate(newDisplayName.trim());
  };

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyInputName.trim() || !familyInputPhone.trim()) return;
    addMemberMutation.mutate({
      fullName: familyInputName.trim(),
      phone: familyInputPhone.trim(),
      relationship: familyInputRelation as Parameters<typeof addHouseholdMember>[0]["relationship"],
    });
  };

  const handleDeleteFamilyMember = (residentId: string) => {
    removeMemberMutation.mutate(residentId);
  };

  if (meQuery.isPending) return <AccountSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat informasi akunmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Akses akun dibatasi"
          description="Akunmu belum memiliki izin untuk membuka halaman ini."
          actionHref="/"
          actionLabel="Ke beranda"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Informasi akun belum dapat diperbarui. Sambungkan kembali perangkatmu lalu coba lagi."
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Akun belum bisa dimuat"
        description="Terjadi kendala saat mengambil informasi akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  const account = meQuery.data.data;
  const context = account.currentContext;
  const displayName = account.displayName ?? "Pengguna Komplekku";
  const residentStatus = account.residentStatus;
  const statusTone =
    residentStatus === "ACTIVE"
      ? "success"
      : residentStatus === "PENDING"
        ? "warning"
        : residentStatus === "REJECTED" || residentStatus === "SUSPENDED"
          ? "danger"
          : "muted";
  const hasResidentCredential = residentStatus === "ACTIVE" && context !== null;

  const CARD: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #80DEEA",
    borderRadius: "1.125rem",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,172,193,0.12)",
  };
  const HERO: React.CSSProperties = {
    background: "#0F2F34",
    padding: "1.125rem 1.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  };
  const FOOT: React.CSSProperties = {
    background: "#0a2228",
    padding: "0.6rem 1.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const SECTION_CARD: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #B2EBF2",
    borderRadius: "1.125rem",
    padding: "1.25rem 1.375rem",
    boxShadow: "0 1px 8px rgba(0,172,193,0.06)",
  };

  const statusColors: Record<string, React.CSSProperties> = {
    success: {
      background: "oklch(92% 0.045 155.85)",
      color: "oklch(42% 0.08 155.85)",
      border: "1px solid oklch(80% 0.07 155.85)",
    },
    warning: {
      background: "oklch(93% 0.05 70.45)",
      color: "oklch(43% 0.105 70.45)",
      border: "1px solid oklch(82% 0.08 70.45)",
    },
    danger: {
      background: "oklch(93% 0.05 23.49)",
      color: "oklch(45% 0.13 23.49)",
      border: "1px solid oklch(82% 0.08 23.49)",
    },
    muted: {
      background: "rgba(255,255,255,0.12)",
      color: "#B2EBF2",
      border: "1px solid rgba(255,255,255,0.2)",
    },
  };

  const StatusBadge = ({ tone, label }: { tone: string; label: string }) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.68rem",
        fontWeight: 800,
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        letterSpacing: "0.02em",
        ...statusColors[tone],
      }}
    >
      {label}
    </span>
  );

  const EditNameBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ubah nama"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "#00ACC1",
        background: "#E0F7FA",
        border: "1px solid #80DEEA",
        borderRadius: "9999px",
        padding: "0.22rem 0.65rem",
        cursor: "pointer",
      }}
    >
      <Edit3 size={11} strokeWidth={2.5} />
      Ubah nama
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
      {hasResidentCredential ? (
        <section aria-labelledby="account-name" style={CARD}>
          <div style={HERO}>
            <BrandMark variant="mark" href={null} />
            <StatusBadge tone={statusTone} label={residentStatusLabels[residentStatus]} />
          </div>

          <div style={{ padding: "1.25rem 1.375rem", background: "#ffffff" }}>
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.3rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "#376E76",
                    margin: 0,
                  }}
                >
                  Nama warga
                </p>
                {!isEditingName && (
                  <EditNameBtn
                    onClick={() => {
                      setNewDisplayName(displayName);
                      setIsEditingName(true);
                      setNameError(null);
                    }}
                  />
                )}
              </div>

              {isEditingName ? (
                <form onSubmit={handleSaveName} style={{ marginTop: "0.375rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="input"
                      placeholder="Nama baru"
                      autoFocus
                      style={{ flex: 1, color: "#0F2F34" }}
                    />
                    <button
                      type="submit"
                      disabled={updateNameMutation.isPending}
                      title="Simpan"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2.25rem",
                        height: "2.25rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: "#00ACC1",
                        color: "#fff",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      title="Batal"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2.25rem",
                        height: "2.25rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #80DEEA",
                        background: "#fff",
                        color: "#376E76",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {nameError && (
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "oklch(45% 0.13 23.49)",
                        marginTop: "0.35rem",
                      }}
                    >
                      {nameError}
                    </p>
                  )}
                </form>
              ) : (
                <h2
                  id="account-name"
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: 800,
                    color: "#0F2F34",
                    letterSpacing: "-0.035em",
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  {displayName}
                </h2>
              )}

              <span
                style={{
                  fontSize: "0.73rem",
                  fontFamily: "monospace",
                  color: "#376E76",
                  marginTop: "0.25rem",
                  display: "block",
                }}
              >
                {account.phoneMasked}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: "1px solid #80DEEA",
              }}
            >
              {[
                { label: "Lingkungan", value: context.community.name },
                { label: "Rumah", value: context.household.house.addressLabel },
                { label: "Rumah tangga", value: context.household.displayName },
              ].map((item, i) => (
                <div
                  key={item.label}
                  style={{
                    padding: "0.75rem 0.875rem",
                    background: "#E0F7FA",
                    borderLeft: i > 0 ? "1px solid #80DEEA" : undefined,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#376E76",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      margin: "0 0 0.2rem",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: "#0F2F34",
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={FOOT}>
            <span style={{ fontSize: "0.68rem", color: "#4DD0E1", fontWeight: 600 }}>
              {context.community.name}
            </span>
            <strong
              style={{
                fontSize: "0.8rem",
                fontFamily: "monospace",
                color: "#4DD0E1",
                fontWeight: 800,
                letterSpacing: "0.1em",
              }}
            >
              {context.household.house.code}
            </strong>
          </div>
        </section>
      ) : (
        <section aria-labelledby="account-name" style={CARD}>
          <div style={HERO}>
            <BrandMark variant="mark" href={null} />
            {residentStatus && (
              <StatusBadge
                tone={statusTone}
                label={residentStatusLabels[residentStatus] ?? residentStatus}
              />
            )}
          </div>
          <div style={{ padding: "1.25rem 1.375rem", background: "#ffffff" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "#376E76",
                  margin: 0,
                }}
              >
                Akun Komplekku
              </p>
              {!isEditingName && (
                <EditNameBtn
                  onClick={() => {
                    setNewDisplayName(displayName);
                    setIsEditingName(true);
                  }}
                />
              )}
            </div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="input"
                  placeholder="Nama baru"
                  style={{ flex: 1, color: "#0F2F34" }}
                />
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: "#00ACC1",
                    color: "#fff",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <h2
                id="account-name"
                style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F2F34", margin: 0 }}
              >
                {displayName}
              </h2>
            )}
            <p
              style={{
                fontSize: "0.73rem",
                fontFamily: "monospace",
                color: "#376E76",
                marginTop: "0.25rem",
              }}
            >
              {account.phoneMasked}
            </p>
          </div>
        </section>
      )}

      {hasResidentCredential && (
        <section style={SECTION_CARD}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.625rem",
                  background: "#E0F7FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00ACC1",
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F2F34", margin: 0 }}>
                  Anggota Keluarga
                </h3>
                <p style={{ fontSize: "0.7rem", color: "#376E76", margin: 0 }}>
                  Penghuni rumah tangga ini
                </p>
              </div>
            </div>
            {!isAddingFamily && (
              <button
                type="button"
                onClick={() => setIsAddingFamily(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: "#00ACC1",
                  border: "none",
                  borderRadius: "0.625rem",
                  padding: "0.45rem 0.875rem",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Tambah
              </button>
            )}
          </div>

          {isAddingFamily && (
            <div
              style={{
                background: "#F3FBFC",
                border: "1px solid #80DEEA",
                borderRadius: "0.75rem",
                padding: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#00ACC1",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  margin: "0 0 0.75rem",
                }}
              >
                <UserPlus size={13} /> Anggota Baru
              </h4>
              <form
                onSubmit={handleAddFamilyMember}
                style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
              >
                <input
                  type="text"
                  required
                  value={familyInputName}
                  onChange={(e) => setFamilyInputName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="input"
                />
                <input
                  type="tel"
                  required
                  value={familyInputPhone}
                  onChange={(e) => setFamilyInputPhone(e.target.value)}
                  placeholder="Nomor HP (08xxxxxxxxxx)"
                  className="input"
                />
                <select
                  value={familyInputRelation}
                  onChange={(e) => setFamilyInputRelation(e.target.value)}
                  className="input"
                >
                  <option value="SPOUSE">Suami / Istri</option>
                  <option value="CHILD">Anak</option>
                  <option value="PARENT">Orang Tua</option>
                  <option value="RELATIVE">Kerabat</option>
                  <option value="TENANT">Penyewa</option>
                  <option value="OTHER">Lainnya</option>
                </select>
                <p style={{ fontSize: "0.7rem", color: "#376E76", margin: 0 }}>
                  Anggota baru akan mendapatkan akun sendiri dan bisa masuk memakai nomor HP ini.
                </p>
                {addMemberError && (
                  <p
                    role="alert"
                    style={{ fontSize: "0.72rem", color: "oklch(45% 0.13 23.49)", margin: 0 }}
                  >
                    {addMemberError}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFamily(false);
                      setAddMemberError(null);
                    }}
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.4rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #80DEEA",
                      background: "#fff",
                      color: "#376E76",
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.4rem 0.875rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      background: "#00ACC1",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {addMemberMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {householdQuery.isPending && (
            <p style={{ fontSize: "0.75rem", color: "#376E76" }}>Memuat anggota rumah tangga...</p>
          )}

          {householdQuery.isError && (
            <p role="alert" style={{ fontSize: "0.75rem", color: "oklch(45% 0.13 23.49)" }}>
              Belum dapat memuat anggota rumah tangga.{" "}
              <button
                type="button"
                onClick={() => void householdQuery.refetch()}
                style={{
                  color: "#00ACC1",
                  fontWeight: 700,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Coba lagi
              </button>
            </p>
          )}

          {householdQuery.data && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {householdQuery.data.data.household.members.map((member) => {
                const isSelf = member.userId === account.id;
                return (
                  <div
                    key={member.residentId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: isSelf ? "#E0F7FA" : "#fff",
                      border: isSelf ? "none" : "1px solid #B2EBF2",
                    }}
                  >
                    <div
                      style={{
                        width: "2.25rem",
                        height: "2.25rem",
                        borderRadius: "9999px",
                        background: isSelf ? "#00ACC1" : "#E0F7FA",
                        color: isSelf ? "#fff" : "#376E76",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        border: isSelf ? undefined : "1px solid #80DEEA",
                        flexShrink: 0,
                      }}
                    >
                      {member.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: isSelf ? 800 : 700,
                            fontSize: "0.875rem",
                            color: "#0F2F34",
                          }}
                        >
                          {member.displayName}
                        </span>
                        {isSelf && (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              background: "#0F2F34",
                              color: "#4DD0E1",
                            }}
                          >
                            Saya
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#376E76", margin: 0 }}>
                        {relationshipLabels[member.relationship] ?? member.relationship}
                        {member.phoneMasked ? ` · ${member.phoneMasked}` : ""}
                      </p>
                    </div>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFamilyMember(member.residentId)}
                        disabled={removeMemberMutation.isPending}
                        aria-label={`Hapus ${member.displayName}`}
                        title={`Hapus ${member.displayName}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "1.75rem",
                          height: "1.75rem",
                          borderRadius: "0.375rem",
                          border: "none",
                          background: "transparent",
                          color: "#376E76",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "oklch(93% 0.05 23.49)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "oklch(45% 0.13 23.49)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color = "#376E76";
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {account.permissions.includes("resident.manage") && (
        <section aria-labelledby="account-admin-heading" style={SECTION_CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.75rem",
                background: "#E0F7FA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00ACC1",
                flexShrink: 0,
              }}
            >
              <ClipboardCheck size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h2
                id="account-admin-heading"
                style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F2F34", margin: 0 }}
              >
                Tugas pengurus
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#376E76", margin: 0 }}>
                Tinjau permohonan tempat tinggal.
              </p>
            </div>
            <Link
              href="/admin/permohonan-warga"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#00ACC1",
                textDecoration: "none",
              }}
            >
              Buka <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="account-session-heading" style={SECTION_CARD}>
        <h2
          id="account-session-heading"
          style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F2F34", margin: "0 0 0.25rem" }}
        >
          Sesi akun
        </h2>
        <p style={{ fontSize: "0.75rem", color: "#376E76", margin: "0 0 1rem" }}>
          Keluar jika perangkat ini dipakai bersama orang lain.
        </p>
        {logoutMutation.isError && (
          <p
            role="alert"
            style={{ color: "oklch(45% 0.13 23.49)", fontSize: "0.75rem", marginBottom: "0.75rem" }}
          >
            {logoutMutation.error instanceof ApiError
              ? logoutMutation.error.message
              : "Belum dapat keluar. Silakan coba lagi."}
          </p>
        )}
        <button
          className="button button--quiet-danger"
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 700,
          }}
        >
          <LogOut size={16} />
          {logoutMutation.isPending ? "Mengakhiri sesi..." : "Keluar dari akun"}
        </button>
      </section>
    </div>
  );
}
