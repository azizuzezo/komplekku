import type { AgendaEvent } from "@komplekku/contracts";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import { formatAgendaDate, formatAgendaTimeRange, getAgendaDateParts } from "./format-agenda";

export function AgendaRow({ event }: { event: AgendaEvent }) {
  const dateParts = getAgendaDateParts(event.date);

  return (
    <article className="agenda-row">
      <Link href={`/agenda/${event.id}`} aria-label={`Buka agenda: ${event.title}`}>
        <div className="agenda-row__date" aria-hidden="true">
          <span>{dateParts.day}</span>
          <span>{dateParts.month}</span>
        </div>
        <div className="agenda-row__content">
          <time dateTime={event.date}>{formatAgendaDate(event.date)}</time>
          <div className="agenda-row__copy">
            <div>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
            </div>
            <ArrowRight size={19} aria-hidden="true" />
          </div>
          <div className="agenda-row__meta">
            <span>
              <Clock3 size={15} aria-hidden="true" />
              {formatAgendaTimeRange(event.startTime, event.endTime)}
            </span>
            <span>
              <MapPin size={15} aria-hidden="true" />
              {event.location}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
