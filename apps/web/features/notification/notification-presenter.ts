export function notificationEntityHref({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string | null;
}) {
  if (!entityId) return undefined;
  if (entityType === "EVENT") return `/agenda/${entityId}`;
  if (entityType === "ANNOUNCEMENT") return `/pengumuman/${entityId}`;
  return undefined;
}

export function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function notificationPriorityLabel(priority: "NORMAL" | "IMPORTANT" | "URGENT") {
  if (priority === "IMPORTANT") return "Penting";
  if (priority === "URGENT") return "Mendesak";
  return "Biasa";
}
