"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Megaphone, MessagesSquare, Receipt, Siren } from "lucide-react";
import Link from "next/link";

import { getMe } from "@/features/auth/auth-api";

/// The same five shortcuts the Flutter home grid offers, so a warga who uses
/// both surfaces finds the daily tasks in the same place. Everything else is
/// behind `ServiceMenu` on the Profil page.
const QUICK_ACTIONS = [
  { href: "/pengumuman", label: "Pengumuman", icon: Megaphone, permission: "announcement.read" },
  { href: "/forum", label: "Forum Warga", icon: MessagesSquare, permission: "forum.read" },
  { href: "/iuran", label: "Iuran", icon: Receipt, permission: "invoice.read" },
  { href: "/laporan", label: "Laporan", icon: Siren, permission: "report.create" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, permission: "agenda.read" },
] as const;

export function HomeQuickActions() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const permissions = meQuery.data?.data.permissions ?? [];
  const visible = QUICK_ACTIONS.filter((action) => permissions.includes(action.permission));

  if (visible.length === 0) return null;

  return (
    <nav className="home-quick-actions" aria-label="Pintasan layanan">
      {visible.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="home-quick-actions__item">
          <span className="home-quick-actions__icon">
            <Icon size={22} aria-hidden="true" />
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
