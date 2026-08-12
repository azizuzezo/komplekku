import type { AnnouncementSummary } from "@komplekku/contracts";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  formatAnnouncementDate,
  getAnnouncementDateParts,
  getPriorityLabel,
} from "./format-announcement";

export function AnnouncementRow({
  announcement,
  featured = false,
}: {
  announcement: AnnouncementSummary;
  featured?: boolean;
}) {
  const dateParts = getAnnouncementDateParts(announcement.publishedAt);

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
        <div className="announcement-row__date" aria-hidden="true">
          <span>{dateParts.day}</span>
          <span>{dateParts.month}</span>
        </div>
        <div className="announcement-row__content">
          <div className="announcement-row__meta">
            {announcement.priority !== "NORMAL" && (
              <span
                className={`priority-label priority-label--${announcement.priority.toLowerCase()}`}
              >
                {getPriorityLabel(announcement.priority)}
              </span>
            )}
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
