"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { adminRoleKeys, listCommunityMembers, listRoles, setMemberRole } from "./admin-role-api";

function readableError(error: unknown) {
  return error instanceof ApiError ? error.message : "Peran belum dapat diubah. Silakan coba lagi.";
}

export function AdminRolePanel() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("resident.manage") ?? false;
  const [pendingResidentId, setPendingResidentId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ residentId: string; message: string } | null>(null);

  const rolesQuery = useQuery({
    queryKey: adminRoleKeys.roles,
    queryFn: listRoles,
    enabled: canManage,
  });
  const membersQuery = useQuery({
    queryKey: adminRoleKeys.members,
    queryFn: listCommunityMembers,
    enabled: canManage,
  });

  const setRoleMutation = useMutation({
    mutationFn: setMemberRole,
    onMutate(variables) {
      setPendingResidentId(variables.residentId);
      setRowError(null);
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: adminRoleKeys.members });
    },
    onError(error, variables) {
      setRowError({ residentId: variables.residentId, message: readableError(error) });
    },
    onSettled() {
      setPendingResidentId(null);
    },
  });

  if (meQuery.isPending || (canManage && (rolesQuery.isPending || membersQuery.isPending))) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk mengelola peran pengguna."
          headingLevel={1}
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Izin akun belum bisa diperiksa"
        description="Terjadi kendala saat mengambil informasi akunmu."
        headingLevel={1}
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canManage) {
    return (
      <StatePanel
        kind="forbidden"
        title="Kelola peran tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mengubah peran pengguna."
        headingLevel={1}
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (rolesQuery.isError || membersQuery.isError) {
    return (
      <StatePanel
        kind="error"
        title="Data pengguna belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar peran atau pengguna."
        headingLevel={1}
        onRetry={() => {
          void rolesQuery.refetch();
          void membersQuery.refetch();
        }}
      />
    );
  }

  const roles = rolesQuery.data?.data.roles ?? [];
  const members = membersQuery.data?.data.items ?? [];

  if (members.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada warga aktif"
        description="Warga yang sudah aktif di komunitas ini akan muncul di daftar ini."
      />
    );
  }

  return (
    <div className="admin-role-panel">
      <ul className="admin-role-list">
        {members.map((member) => {
          const currentRoleCode = member.roles[0]?.code ?? "";
          const isPending = pendingResidentId === member.residentId;
          return (
            <li className="admin-role-row" key={member.residentId}>
              <div className="admin-role-row__info">
                <p className="admin-role-row__name">{member.displayName}</p>
                <p className="admin-role-row__meta">
                  {member.phoneMasked}
                  {member.houseCode ? ` · ${member.houseCode}` : ""}
                </p>
              </div>
              <div className="admin-role-row__control">
                <select
                  className="input"
                  aria-label={`Peran untuk ${member.displayName}`}
                  value={currentRoleCode}
                  disabled={isPending}
                  onChange={(e) =>
                    setRoleMutation.mutate({
                      residentId: member.residentId,
                      roleCode: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Belum ada peran
                  </option>
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {rowError?.residentId === member.residentId && (
                  <p className="field-error" role="alert">
                    {rowError.message}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
