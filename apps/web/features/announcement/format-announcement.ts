import type { AnnouncementPriority } from "@komplekku/contracts";

const priorityLabels: Record<AnnouncementPriority, string> = {
  NORMAL: "Biasa",
  IMPORTANT: "Penting",
  URGENT: "Mendesak",
};

export function getPriorityLabel(priority: AnnouncementPriority) {
  return priorityLabels[priority];
}

export function formatAnnouncementDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function getAnnouncementDateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date),
    month: new Intl.DateTimeFormat("id-ID", {
      month: "short",
      timeZone: "Asia/Jakarta",
    }).format(date),
  };
}
