import type { AgendaEvent } from "@komplekku/contracts";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import { EntityActions } from "@/components/ui/entity-actions";

import { formatAgendaDate, formatAgendaTimeRange, getAgendaDateParts } from "./format-agenda";

export function AgendaRow({
  event,
  canManage = false,
  onEdit,
  onDelete,
  isBusy = false,
}: {
  event: AgendaEvent;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isBusy?: boolean;
}) {
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
      {canManage && (
        <div className="agenda-row__actions">
          <EntityActions
            onEdit={onEdit}
            onDelete={onDelete}
            isBusy={isBusy}
            deleteTitle="Hapus agenda?"
            deleteMessage={`"${event.title}" tidak akan terlihat lagi di kalender warga.`}
            label={`Kelola agenda ${event.title}`}
          />
        </div>
      )}
    </article>
  );
}
