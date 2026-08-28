import type { TemplateField } from "./types";

export function fieldNeedsFix(field: TemplateField): boolean {
  return !!field.needsReview;
}

export function residentCanSubmit(
  resident: { handoff: TemplateField[]; progress: TemplateField[] }
): boolean {
  const fields = [...resident.handoff, ...resident.progress];
  return fields.every((f) => !fieldNeedsFix(f));
}
