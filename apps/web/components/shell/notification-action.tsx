"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

import { getMe } from "@/features/auth/auth-api";
import {
  getNotificationUnreadCount,
  notificationKeys,
} from "@/features/notification/notification-api";

export function NotificationAction() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canReadNotifications =
    meQuery.data?.data.permissions.includes("notification.read") ?? false;
  const unreadQuery = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getNotificationUnreadCount,
    enabled: canReadNotifications,
  });

  if (!canReadNotifications) return null;

  const unreadCount = unreadQuery.data?.data.unreadCount ?? 0;
  const label =
    unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi, semua sudah dibaca";

  return (
    <Link className="notification-action" href="/notifikasi" aria-label={label} title="Notifikasi">
      <Bell size={20} strokeWidth={1.9} aria-hidden="true" />
      {unreadCount > 0 && <span aria-hidden="true">{unreadCount}</span>}
    </Link>
  );
}
