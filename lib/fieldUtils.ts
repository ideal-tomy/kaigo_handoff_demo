import type { TemplateField } from "./types";

export function fieldNeedsFix(field: TemplateField): boolean {
  if (!field.needsReview || !field.correctValue) return false;
  return field.value !== field.correctValue;
}

export function allFieldsFixed(fields: TemplateField[]): boolean {
  return fields.every((f) => !fieldNeedsFix(f));
}

export function allResidentsFixed(
  residents: Array<{ handoff: TemplateField[]; progress: TemplateField[] }>
): boolean {
  return residents.every(
    (r) => allFieldsFixed(r.handoff) && allFieldsFixed(r.progress)
  );
}
