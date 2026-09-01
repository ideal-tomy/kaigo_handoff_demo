import { MEMO_RESIDENTS } from "./memoDay";
import { readOverlay } from "./nippoOverlay";
import type { SubmittedRecord } from "./recordsStore";
import type { Priority, TemplateField } from "./types";

export type FloorRow = {
  id: string;
  room: string;
  name: string;
  handoff: "none" | "submitted" | "confirmed";
  karte: "none" | "submitted" | "confirmed";
  progressText: string;
  handoffText: string;
  notice: string;
  priority: Priority;
};

function shortText(value: string, max = 28) {
  const t = value.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function pickField(fields: TemplateField[], keys: string[]) {
  for (const key of keys) {
    const hit = fields.find((f) => f.key === key && f.value.trim());
    if (hit) return hit.value.trim();
  }
  const first = fields.find((f) => f.value.trim());
  return first?.value.trim() ?? "";
}

function summarizeProgress(row: SubmittedRecord | null) {
  if (!row) return "";
  if (row.kind === "karte") {
    const hit = pickField(row.extraFields ?? [], ["complaint", "meal", "pain", "condition"]);
    return shortText(hit || row.quote || "");
  }
  const vitals = pickField(row.progress, ["vitals", "condition", "meal", "sleep"]);
  return shortText(vitals);
}

function summarizeHandoff(row: SubmittedRecord | null) {
  if (!row) return "";
  const next = pickField(row.handoff, ["nextAction", "medication"]);
  const med = pickField(row.handoff, ["medication"]);
  if (med && next && med !== next) return shortText(`${med} / ${next}`, 32);
  return shortText(next || med);
}

function noticesFrom(row: SubmittedRecord | null): TemplateField[] {
  if (!row) return [];
  return [...row.progress, ...row.handoff, ...(row.extraFields ?? [])].filter(
    (f) => f.value && (f.priority === "urgent" || f.priority === "attention")
  );
}

function statusOf(row: SubmittedRecord | null): FloorRow["handoff"] {
  if (!row) return "none";
  return row.status === "confirmed" ? "confirmed" : "submitted";
}

export function buildFloor(records: SubmittedRecord[]): FloorRow[] {
  const overlay = readOverlay();

  return MEMO_RESIDENTS.map((person) => {
    const allHandoff = records.filter((r) => r.residentId === person.id && r.kind === "handoff");
    const allKarte = records.filter((r) => r.residentId === person.id && r.kind === "karte");
    const handoffLatest = allHandoff[0] ?? null;
    const karteLatest = allKarte[0] ?? null;
    const handoffOk = allHandoff.find((r) => r.status === "confirmed") ?? null;
    const karteOk = allKarte.find((r) => r.status === "confirmed") ?? null;
    const voice = overlay[person.id];

    const noticeFields = [
      ...noticesFrom(handoffLatest),
      ...noticesFrom(karteLatest),
      ...noticesFrom(handoffOk),
      ...noticesFrom(karteOk),
    ];
    const urgent = noticeFields.filter((f) => f.priority === "urgent");
    const pick = urgent[0] ?? noticeFields[0];
    const noticePriority: Priority = noticeFields.some((f) => f.priority === "urgent")
      ? "urgent"
      : noticeFields.some((f) => f.priority === "attention")
        ? "attention"
        : "normal";

    let handoff = statusOf(handoffLatest);
    let karte = statusOf(karteLatest);
    let handoffText = handoffOk ? summarizeHandoff(handoffOk) : "";
    let progressText = handoffOk ? summarizeProgress(handoffOk) : "";
    if (karteOk) {
      const karteProgress = summarizeProgress(karteOk);
      progressText = progressText ? `${progressText} / ${karteProgress}` : karteProgress;
    }
    let notice = pick?.value ? shortText(pick.value, 24) : "";

    if (voice && handoff !== "confirmed") {
      handoff = "confirmed";
      handoffText = voice.handoffText;
      if (!progressText) progressText = voice.progressText;
      if (!notice && voice.notice) notice = voice.notice;
    }
    if (voice?.karte === "confirmed" && karte !== "confirmed") {
      karte = "confirmed";
      if (voice.karteText && !progressText.includes(voice.karteText)) {
        progressText = progressText ? `${progressText} / ${voice.karteText}` : voice.karteText;
      }
    }

    return {
      id: person.id,
      room: person.room,
      name: person.name,
      handoff,
      karte,
      progressText: progressText || "—",
      handoffText: handoffText || (handoff === "confirmed" ? "確認済" : "—"),
      notice: notice || "—",
      priority: voice?.priority ?? noticePriority,
    };
  });
}

export function statusLabel(status: FloorRow["handoff"], kind: "handoff" | "karte") {
  if (status === "confirmed") return "確認済";
  if (status === "submitted") return kind === "karte" ? "記録済" : "提出済";
  return "—";
}
