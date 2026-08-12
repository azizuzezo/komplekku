"use client";

import { useQuery } from "@tanstack/react-query";
import { Home, Megaphone, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getMe } from "@/features/auth/auth-api";

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
  { href: "/akun", label: "Akun", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation() {
  const pathname = usePathname();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const permissions = meQuery.data?.data.permissions ?? [];
  const visibleNavigation = navigation.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  return (
    <nav className="mobile-navigation" aria-label="Navigasi utama">
      {visibleNavigation.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            className="mobile-navigation__item"
            href={href}
            aria-current={active ? "page" : undefined}
            key={href}
          >
            <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
