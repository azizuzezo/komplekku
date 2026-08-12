import type { ReactNode } from "react";

import { BrandMark } from "@/components/ui/brand-mark";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { NotificationAction } from "./notification-action";

type AppShellProps = {
  children: ReactNode;
  contextLabel?: string;
};

export function AppShell({ children, contextLabel = "Lingkungan warga" }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <DesktopSidebar />
      <div className="app-shell__body">
        <header className="mobile-header">
          <BrandMark variant="mark" />
          <div className="mobile-header__end">
            <span className="mobile-header__context">{contextLabel}</span>
            <NotificationAction />
          </div>
        </header>
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
