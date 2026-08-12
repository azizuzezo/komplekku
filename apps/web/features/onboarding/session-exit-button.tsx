"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { logout } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api/client";

export function SessionExitButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess() {
      queryClient.clear();
      router.replace("/masuk");
      router.refresh();
    },
  });

  return (
    <div className="onboarding-session-exit">
      {logoutMutation.isError && (
        <p className="form-message" role="alert">
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
      >
        <LogOut size={18} aria-hidden="true" />
        {logoutMutation.isPending ? "Mengakhiri sesi…" : "Keluar dari akun"}
      </button>
    </div>
  );
}
