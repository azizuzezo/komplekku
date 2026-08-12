"use client";

import {
  Inbox,
  LockKeyhole,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type StateKind = "empty" | "error" | "offline" | "unauthorized" | "forbidden";

const icons: Record<StateKind, LucideIcon> = {
  empty: Inbox,
  error: TriangleAlert,
  offline: WifiOff,
  unauthorized: LockKeyhole,
  forbidden: ShieldAlert,
};

type StatePanelProps = {
  kind: StateKind;
  title: string;
  description: string;
  headingLevel?: 1 | 2;
  actionHref?: string;
  actionLabel?: string;
  onRetry?: () => void;
};

export function StatePanel({
  kind,
  title,
  description,
  headingLevel = 2,
  actionHref,
  actionLabel,
  onRetry,
}: StatePanelProps) {
  const Icon = icons[kind];
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const tone =
    kind === "error" || kind === "forbidden"
      ? " status-panel--danger"
      : kind === "offline"
        ? " status-panel--warning"
        : "";

  return (
    <section
      className={`status-panel${tone}`}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <span className="status-panel__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.9} />
      </span>
      <div>
        <Heading>{title}</Heading>
        <p>{description}</p>
      </div>
      {(onRetry || (actionHref && actionLabel)) && (
        <div className="status-panel__actions">
          {onRetry && (
            <button className="button button--primary" type="button" onClick={onRetry}>
              Coba lagi
            </button>
          )}
          {actionHref && actionLabel && (
            <Link className="button button--secondary" href={actionHref}>
              {actionLabel}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
