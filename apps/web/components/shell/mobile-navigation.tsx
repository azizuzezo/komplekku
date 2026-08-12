"use client";

import { useState } from "react";
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
  LayoutGrid,
  ListChecks,
  Megaphone,
  MessageSquareWarning,
  Package,
  ShieldCheck,
  Siren,
  UserCheck,
  UserRound,
  Video,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getMe } from "@/features/auth/auth-api";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  category?: "resident" | "admin";
};

const allServices: NavigationItem[] = [
  {
    href: "/agenda",
    label: "Agenda",
    icon: CalendarDays,
    permission: "agenda.read",
    category: "resident",
  },
  {
    href: "/notifikasi",
    label: "Notifikasi",
    icon: Bell,
    permission: "notification.read",
    category: "resident",
  },
  {
    href: "/darurat",
    label: "Darurat",
    icon: Siren,
    permission: "emergency.create",
    category: "resident",
  },
  {
    href: "/tamu",
    label: "Tamu",
    icon: UserCheck,
    permission: "visitor.create",
    category: "resident",
  },
  {
    href: "/paket",
    label: "Paket",
    icon: Package,
    permission: "package.read",
    category: "resident",
  },
  {
    href: "/cctv",
    label: "CCTV",
    icon: Video,
    permission: "camera.public.read",
    category: "resident",
  },
  {
    href: "/laporan",
    label: "Lapor Masalah",
    icon: MessageSquareWarning,
    permission: "report.create",
    category: "resident",
  },
  {
    href: "/surat",
    label: "Surat",
    icon: FileText,
    permission: "letter.create",
    category: "resident",
  },
  {
    href: "/fasilitas",
    label: "Fasilitas",
    icon: Building2,
    permission: "facility.read",
    category: "resident",
  },
  {
    href: "/iuran",
    label: "Iuran",
    icon: Wallet,
    permission: "invoice.read",
    category: "resident",
  },
  {
    href: "/transparansi-kas",
    label: "Transparansi Kas",
    icon: Landmark,
    permission: "cash.read",
    category: "resident",
  },
  {
    href: "/admin/permohonan-warga",
    label: "Permohonan warga",
    icon: ClipboardCheck,
    permission: "resident.manage",
    category: "admin",
  },
  {
    href: "/admin/keamanan",
    label: "Keamanan",
    icon: ShieldCheck,
    permission: "security.dashboard.read",
    category: "admin",
  },
  {
    href: "/admin/laporan",
    label: "Kelola Laporan",
    icon: ListChecks,
    permission: "report.manage",
    category: "admin",
  },
  {
    href: "/admin/surat",
    label: "Tinjau Surat",
    icon: FileCheck2,
    permission: "letter.manage",
    category: "admin",
  },
  {
    href: "/admin/keuangan",
    label: "Keuangan",
    icon: BadgeDollarSign,
    permission: "finance.dashboard.read",
    category: "admin",
  },
  {
    href: "/admin/rumah",
    label: "Kelola Rumah",
    icon: HousePlus,
    permission: "resident.manage",
    category: "admin",
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const permissions = meQuery.data?.data.permissions ?? [];

  const visibleServices = allServices.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  const residentServices = visibleServices.filter((s) => s.category === "resident");
  const adminServices = visibleServices.filter((s) => s.category === "admin");

  return (
    <>
      <nav className="mobile-navigation" aria-label="Navigasi utama">
        <Link
          className="mobile-navigation__item"
          href="/"
          aria-current={isActive(pathname, "/") ? "page" : undefined}
        >
          <Home size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>Beranda</span>
        </Link>

        <Link
          className="mobile-navigation__item"
          href="/pengumuman"
          aria-current={isActive(pathname, "/pengumuman") ? "page" : undefined}
        >
          <Megaphone size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>Pengumuman</span>
        </Link>

        <button
          type="button"
          className={`mobile-navigation__item ${menuOpen ? "text-primary font-bold" : ""}`}
          onClick={() => setMenuOpen(true)}
        >
          <LayoutGrid size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>Layanan</span>
        </button>

        <Link
          className="mobile-navigation__item"
          href="/akun"
          aria-current={isActive(pathname, "/akun") ? "page" : undefined}
        >
          <UserRound size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>Akun</span>
        </Link>
      </nav>

      {/* Full Feature Service Menu Sheet with High Contrast White Background */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 pb-24 max-h-[90vh] overflow-y-auto border-t border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-extrabold text-lg text-text-primary">
                  Semua Layanan Lingkungan
                </h3>
                <p className="text-xs text-text-secondary">Pilih fitur layanan warga & pengurus</p>
              </div>
              <button
                type="button"
                className="p-2 text-text-secondary hover:text-text-primary rounded-full bg-surface-soft border border-border"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Resident Services Grid */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                  Layanan Warga
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {residentServices.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-surface-soft hover:bg-surface-sage transition-all text-center shadow-2xs"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon size={24} className="text-primary mb-2 shrink-0" />
                      <span className="text-xs font-bold text-text-primary leading-tight">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin Services Grid */}
              {adminServices.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 pt-3 border-t border-border">
                    Fitur Pengurus / Admin
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {adminServices.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-surface-sage hover:bg-surface-soft transition-all text-center shadow-2xs"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon size={24} className="text-primary mb-2 shrink-0" />
                        <span className="text-xs font-bold text-text-primary leading-tight">
                          {label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
