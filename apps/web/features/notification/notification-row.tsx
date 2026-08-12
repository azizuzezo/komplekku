import type { Notification } from "@komplekku/contracts";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import {
  formatNotificationDate,
  notificationEntityHref,
  notificationPriorityLabel,
} from "./notification-presenter";

type NotificationRowProps = {
  notification: Notification;
  isMarkingRead: boolean;
  readError?: string;
  onMarkRead: (id: string) => void;
};

export function NotificationRow({
  notification,
  isMarkingRead,
  readError,
  onMarkRead,
}: NotificationRowProps) {
  const entityHref = notificationEntityHref(notification);
  const unread = notification.readAt === null;

  return (
    <article className={`notification-row${unread ? " notification-row--unread" : ""}`}>
      <div className="notification-row__meta">
        {notification.priority !== "NORMAL" && (
          <span className={`priority-label priority-label--${notification.priority.toLowerCase()}`}>
            {notificationPriorityLabel(notification.priority)}
          </span>
        )}
        {unread && <span className="unread-label">Belum dibaca</span>}
        <time dateTime={notification.createdAt}>
          {formatNotificationDate(notification.createdAt)}
        </time>
      </div>
      <div className="notification-row__copy">
        <h2>{notification.title}</h2>
        <p>{notification.message}</p>
      </div>
      <div className="notification-row__actions">
        {unread && (
          <button
            className="button button--secondary button--compact"
            type="button"
            onClick={() => onMarkRead(notification.id)}
            disabled={isMarkingRead}
          >
            <Check size={16} aria-hidden="true" />
            {isMarkingRead ? "Menyimpan…" : "Tandai dibaca"}
          </button>
        )}
        {entityHref && (
          <Link className="text-link" href={entityHref}>
            Buka terkait
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      {readError && (
        <p className="notification-row__error" role="alert">
          {readError}
        </p>
      )}
    </article>
  );
}
