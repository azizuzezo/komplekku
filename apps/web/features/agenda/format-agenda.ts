function agendaDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

export function formatAgendaDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(agendaDate(value));
}

export function getAgendaDateParts(value: string) {
  const date = agendaDate(value);
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit", timeZone: "UTC" }).format(date),
    month: new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(date),
  };
}

export function formatAgendaTimeRange(startTime: string, endTime: string) {
  return `${startTime}–${endTime}`;
}
