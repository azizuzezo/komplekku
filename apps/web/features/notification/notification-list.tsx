"use client";

import type {
  NotificationUnreadCountResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from "@komplekku/contracts";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, LoaderCircle } from "lucide-react";

import { NotificationListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  clearUnreadCount,
  decrementUnreadCount,
  setAllNotificationsRead,
  setNotificationRead,
  type NotificationPages,
} from "./notification-cache";
import {
  getNotificationPage,
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
} from "./notification-api";
import { NotificationRow } from "./notification-row";

function readableMutationError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Status notifikasi belum dapat disimpan. Silakan coba lagi.";
}

export function NotificationList() {
  const queryClient = useQueryClient();
  const notificationsQuery = useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) => getNotificationPage({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  });
  const unreadCountQuery = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getNotificationUnreadCount,
  });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess(response: MarkNotificationReadResponse) {
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.lists },
        (current) =>
          setNotificationRead(current, response.data.notificationId, response.data.readAt),
      );
      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationKeys.unreadCount,
        decrementUnreadCount,
      );
    },
  });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess(response: MarkAllNotificationsReadResponse) {
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.lists },
        (current) => setAllNotificationsRead(current, response.data.readAt),
      );
      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationKeys.unreadCount,
        clearUnreadCount,
      );
    },
  });

  if (notificationsQuery.isPending) return <NotificationListSkeleton />;

  if (notificationsQuery.isError) {
    const state = getRequestState(notificationsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat notifikasi akunmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Notifikasi belum dapat diakses"
          description="Akunmu belum memiliki izin untuk melihat notifikasi."
          actionHref="/akun"
          actionLabel="Lihat akun"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar notifikasi belum dapat diperbarui."
          onRetry={() => void notificationsQuery.refetch()}
          actionHref="/offline"
          actionLabel="Info mode offline"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Notifikasi belum bisa dimuat"
        description="Terjadi kendala saat mengambil notifikasi akunmu."
        onRetry={() => void notificationsQuery.refetch()}
      />
    );
  }

  const notifications = notificationsQuery.data.pages.flatMap((page) => page.data.items);
  const fetchNextPage = notificationsQuery.fetchNextPage;
  const unreadCount = unreadCountQuery.data?.data.unreadCount;
  const hasUnread =
    unreadCount !== undefined ? unreadCount > 0 : notifications.some((item) => !item.readAt);
  const activeReadId = readMutation.isPending ? readMutation.variables : undefined;
  const readErrorId = readMutation.isError ? readMutation.variables : undefined;

  return (
    <div className="notification-index">
      <div className="notification-toolbar">
        <p>
          {unreadCount === undefined
            ? "Notifikasi akun"
            : unreadCount > 0
              ? `${unreadCount} belum dibaca`
              : "Semua sudah dibaca"}
        </p>
        {hasUnread && (
          <button
            className="button button--secondary button--compact"
            type="button"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            <CheckCheck size={17} aria-hidden="true" />
            {readAllMutation.isPending ? "Menyimpan…" : "Tandai semua dibaca"}
          </button>
        )}
      </div>

      {readAllMutation.isError && (
        <p className="form-message" role="alert">
          {readableMutationError(readAllMutation.error)}
        </p>
      )}

      {notifications.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada notifikasi"
          description="Pembaruan yang ditujukan untuk akunmu akan muncul di sini."
        />
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <NotificationRow
              notification={notification}
              isMarkingRead={activeReadId === notification.id}
              readError={
                readErrorId === notification.id
                  ? readableMutationError(readMutation.error)
                  : undefined
              }
              onMarkRead={(id) => readMutation.mutate(id)}
              key={notification.id}
            />
          ))}
        </div>
      )}

      {notificationsQuery.isFetchNextPageError && (
        <div className="pagination-error" role="status">
          <p>Notifikasi berikutnya belum dapat dimuat.</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void fetchNextPage()}
          >
            Coba lagi
          </button>
        </div>
      )}

      {notificationsQuery.hasNextPage && !notificationsQuery.isFetchNextPageError && (
        <button
          className="button button--secondary pagination-action"
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={notificationsQuery.isFetchingNextPage}
        >
          {notificationsQuery.isFetchingNextPage ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Memuat notifikasi…
            </>
          ) : (
            "Muat notifikasi berikutnya"
          )}
        </button>
      )}
    </div>
  );
}
