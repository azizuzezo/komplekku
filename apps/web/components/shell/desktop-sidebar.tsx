"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Home,
  HousePlus,
  Landmark,
  ListChecks,
  Megaphone,
  MessageSquareWarning,
  Package,
  ShieldCheck,
  Siren,
  UserRound,
  UserCheck,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/ui/brand-mark";
import { getMe } from "@/features/auth/auth-api";
import {
  getNotificationUnreadCount,
  notificationKeys,
} from "@/features/notification/notification-api";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
};

const navigation: NavigationItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  {
    href: "/pengumuman",
    label: "Pengumuman",
    icon: Megaphone,
    permission: "announcement.read",
  },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, permission: "agenda.read" },
  {
    href: "/notifikasi",
    label: "Notifikasi",
    icon: Bell,
    permission: "notification.read",
  },
  { href: "/darurat", label: "Darurat", icon: Siren, permission: "emergency.create" },
  { href: "/tamu", label: "Tamu", icon: UserCheck, permission: "visitor.create" },
  { href: "/paket", label: "Paket", icon: Package, permission: "package.read" },
  { href: "/cctv", label: "CCTV", icon: Video, permission: "camera.public.read" },
  { href: "/laporan", label: "Lapor Masalah", icon: MessageSquareWarning, permission: "report.create" },
  { href: "/surat", label: "Surat", icon: FileText, permission: "letter.create" },
  { href: "/fasilitas", label: "Fasilitas", icon: Building2, permission: "facility.read" },
  { href: "/iuran", label: "Iuran", icon: Wallet, permission: "invoice.read" },
  {
    href: "/transparansi-kas",
    label: "Transparansi Kas",
    icon: Landmark,
    permission: "cash.read",
  },
  { href: "/akun", label: "Akun", icon: UserRound },
  {
    href: "/admin/permohonan-warga",
    label: "Permohonan warga",
    icon: ClipboardCheck,
    permission: "resident.manage",
  },
  {
    href: "/admin/keamanan",
    label: "Keamanan",
    icon: ShieldCheck,
    permission: "security.dashboard.read",
  },
  {
    href: "/admin/laporan",
    label: "Kelola Laporan",
    icon: ListChecks,
    permission: "report.manage",
  },
  {
    href: "/admin/surat",
    label: "Tinjau Surat",
    icon: FileCheck2,
    permission: "letter.manage",
  },
  {
    href: "/admin/keuangan",
    label: "Keuangan",
    icon: BadgeDollarSign,
    permission: "finance.dashboard.read",
  },
  {
    href: "/admin/rumah",
    label: "Kelola Rumah",
    icon: HousePlus,
    permission: "resident.manage",
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const account = meQuery.data?.data;
  const context = account?.currentContext;
  const permissions = account?.permissions ?? [];
  const canReadNotifications = permissions.includes("notification.read");
  const unreadQuery = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getNotificationUnreadCount,
    enabled: canReadNotifications,
  });
  const unreadCount = unreadQuery.data?.data.unreadCount ?? 0;
  const visibleNavigation = navigation.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  return (
    <aside className="desktop-sidebar" aria-label="Navigasi utama">
      <div className="sidebar-brand sidebar-brand--compact">
        <BrandMark variant="mark" />
      </div>
      <div className="sidebar-brand sidebar-brand--full">
        <BrandMark priority />
      </div>
      <p className="sidebar-nav__label">Menu utama</p>
      <nav className="sidebar-nav">
        {visibleNavigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const itemUnreadCount = href === "/notifikasi" ? unreadCount : 0;
          const accessibleLabel =
            itemUnreadCount > 0 ? `${label}, ${itemUnreadCount} belum dibaca` : label;
          return (
            <Link
              className="sidebar-nav__item"
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={accessibleLabel}
              title={label}
              key={href}
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              <span className="sidebar-nav__text" aria-hidden="true">
                {label}
              </span>
              {itemUnreadCount > 0 && (
                <span className="sidebar-nav__count" aria-hidden="true">
                  {itemUnreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {context ? (
        <section className="sidebar-resident" aria-label="Konteks tempat tinggal aktif">
          <p className="sidebar-resident__community">{context.community.name}</p>
          <p className="sidebar-resident__house">{context.household.house.code}</p>
          <p className="sidebar-resident__name">
            {account?.displayName ?? context.household.displayName}
          </p>
        </section>
      ) : (
        <p className="sidebar-footnote">Semua kebutuhan lingkungan, dalam satu tempat.</p>
      )}
    </aside>
  );
}
