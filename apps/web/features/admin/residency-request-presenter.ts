import type { HouseholdRelationship } from "@komplekku/contracts";

const relationshipLabels: Record<HouseholdRelationship, string> = {
  HEAD: "Kepala rumah tangga",
  SPOUSE: "Suami atau istri",
  CHILD: "Anak",
  PARENT: "Orang tua",
  RELATIVE: "Keluarga",
  TENANT: "Penyewa",
  OTHER: "Lainnya",
};

export function relationshipLabel(relationship: HouseholdRelationship) {
  return relationshipLabels[relationship];
}

export function formatResidencySubmittedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
