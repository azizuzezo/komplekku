import {
  ANNOUNCEMENT_BADGE_LABELS,
  announcementBadge,
  type AnnouncementSummary,
} from "@komplekku/contracts";
import { ArrowRight, CalendarDays, Info, Megaphone } from "lucide-react";
import Link from "next/link";

import { formatAnnouncementDate } from "./format-announcement";

/** Stands in for a cover photo the author never uploaded, so every row keeps
 * the same shape instead of collapsing into a bare text list. */
const BADGE_ICONS = {
  important: Megaphone,
  event: CalendarDays,
  info: Info,
} as const;

export function AnnouncementRow({
  announcement,
  featured = false,
}: {
  announcement: AnnouncementSummary;
  featured?: boolean;
}) {
  const badge = announcementBadge(announcement);
  const BadgeIcon = BADGE_ICONS[badge];

  return (
    <article
      className={`announcement-row${featured ? " announcement-row--featured" : ""}${
        announcement.isRead ? "" : " announcement-row--unread"
      }`}
    >
      <Link
        href={`/pengumuman/${announcement.id}`}
        aria-label={`Baca pengumuman: ${announcement.title}`}
      >
        {announcement.coverImageUrl ? (
          <img
            className="announcement-row__cover"
            src={announcement.coverImageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div
            className={`announcement-row__cover announcement-row__cover--fallback announcement-row__cover--${badge}`}
            aria-hidden="true"
          >
            <BadgeIcon size={22} />
          </div>
        )}
        <div className="announcement-row__content">
          <div className="announcement-row__meta">
            <span className={`announcement-badge announcement-badge--${badge}`}>
              {ANNOUNCEMENT_BADGE_LABELS[badge]}
            </span>
            {!announcement.isRead && <span className="unread-label">Belum dibaca</span>}
            <time dateTime={announcement.publishedAt}>
              {formatAnnouncementDate(announcement.publishedAt)}
            </time>
          </div>
          <div className="announcement-row__copy">
            <div>
              <h3>{announcement.title}</h3>
              <p>{announcement.summary}</p>
            </div>
            <ArrowRight size={19} aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  );
}
