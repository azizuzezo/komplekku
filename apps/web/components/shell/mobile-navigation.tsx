"use client";

import { Home, Megaphone, MessagesSquare, Moon, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const DESTINATIONS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/shalat", label: "Shalat", icon: Moon },
  { href: "/pengumuman", label: "Pengumuman", icon: Megaphone },
  { href: "/forum", label: "Forum", icon: MessagesSquare },
  { href: "/akun", label: "Profil", icon: UserRound },
] as const;

/// The five primary destinations. Everything else — Keamanan, Layanan, and the
/// pengurus tools — lives behind `ServiceMenu` on the Profil page, so the bar
/// stays legible on a phone.
export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="mobile-navigation" aria-label="Navigasi utama">
      {DESTINATIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          className="mobile-navigation__item"
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
        >
          <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
