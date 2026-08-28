import type { ResidentDraft, TemplateField } from "./types";

export function fieldNeedsFix(field: TemplateField): boolean {
  return !!field.needsReview;
}

export function residentCanSubmit(
  resident: { handoff: TemplateField[]; progress: TemplateField[] }
): boolean {
  const fields = [...resident.handoff, ...resident.progress];
  return fields.every((f) => !fieldNeedsFix(f));
}

export function countReviewFields(
  resident: { handoff: TemplateField[]; progress: TemplateField[] }
): number {
  return [...resident.handoff, ...resident.progress].filter(fieldNeedsFix).length;
}

export function getFirstReviewField(
  resident: ResidentDraft
): { doc: "handoff" | "progress"; field: TemplateField } | null {
  for (const field of resident.progress) {
    if (fieldNeedsFix(field)) return { doc: "progress", field };
  }
  for (const field of resident.handoff) {
    if (fieldNeedsFix(field)) return { doc: "handoff", field };
  }
  return null;
}
