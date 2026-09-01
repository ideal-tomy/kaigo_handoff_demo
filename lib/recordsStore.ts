"use client";

import type { Priority, ResidentDraft, TemplateField } from "./types";
import { STAFF_NAME, todayLabel, nowTime } from "./facility";

export type RecordKind = "handoff" | "karte";
export type RecordStatus = "submitted" | "confirmed";

export type SubmittedRecord = {
  id: string;
  kind: RecordKind;
  author: string;
  residentId: string;
  name: string;
  room: string;
  dateLabel: string;
  submittedAt: string;
  confirmedAt?: string;
  status: RecordStatus;
  priority: Priority;
  notes: string;
  quote?: string;
  assessment?: string;
  progress: TemplateField[];
  handoff: TemplateField[];
  extraFields?: TemplateField[];
};

const KEY = "kaigo-handoff-records";
const FOCUS_KEY = "kaigo-handoff-focus";

function normalize(row: SubmittedRecord): SubmittedRecord {
  return {
    ...row,
    status: row.status ?? "submitted",
  };
}

function read(): SubmittedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    const rows = raw ? (JSON.parse(raw) as SubmittedRecord[]) : [];
    return rows.map(normalize);
  } catch {
    return [];
  }
}

function write(rows: SubmittedRecord[]) {
  sessionStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("kaigo-records"));
}

function setFocus(id: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FOCUS_KEY, id);
}

export function takeFocus(): string | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(FOCUS_KEY);
  if (id) sessionStorage.removeItem(FOCUS_KEY);
  return id;
}

export function listRecords(): SubmittedRecord[] {
  return read();
}

export function listMine(): SubmittedRecord[] {
  return read().filter((r) => r.author === STAFF_NAME);
}

export function listPending(): SubmittedRecord[] {
  return read().filter((r) => r.status !== "confirmed");
}

export function listConfirmed(): SubmittedRecord[] {
  return read().filter((r) => r.status === "confirmed");
}

export function confirmRecord(id: string) {
  write(
    read().map((row) =>
      row.id === id ? { ...row, status: "confirmed", confirmedAt: nowTime() } : row
    )
  );
}

function fieldPriority(fields: TemplateField[]): Priority {
  if (fields.some((f) => f.priority === "urgent")) return "urgent";
  if (fields.some((f) => f.priority === "attention")) return "attention";
  return "normal";
}

export function addHandoffRecord(resident: ResidentDraft, dateLabel: string, submittedAt: string) {
  const row: SubmittedRecord = {
    id: `h-${resident.id}-${Date.now()}`,
    kind: "handoff",
    author: STAFF_NAME,
    residentId: resident.id,
    name: resident.name,
    room: resident.room,
    dateLabel,
    submittedAt,
    status: "submitted",
    priority: resident.priority,
    notes: resident.notes,
    progress: resident.progress.map((f) => ({ ...f })),
    handoff: resident.handoff.map((f) => ({ ...f })),
  };
  write([row, ...read()]);
  setFocus(row.id);
  return row.id;
}

export function addKarteRecord(input: {
  residentId: string;
  name: string;
  room: string;
  dateLabel: string;
  submittedAt: string;
  quote: string;
  assessment: string;
  fields: TemplateField[];
  notes: string;
}) {
  const row: SubmittedRecord = {
    id: `k-${input.residentId}-${Date.now()}`,
    kind: "karte",
    author: STAFF_NAME,
    residentId: input.residentId,
    name: input.name,
    room: input.room,
    dateLabel: input.dateLabel,
    submittedAt: input.submittedAt,
    status: "submitted",
    priority: fieldPriority(input.fields),
    notes: input.notes,
    quote: input.quote,
    assessment: input.assessment,
    progress: [],
    handoff: [],
    extraFields: input.fields,
  };
  write([row, ...read()]);
  setFocus(row.id);
  return row.id;
}

export function ensureSeed() {
  if (read().length > 0) return;
  write([
    {
      id: "seed-night",
      kind: "handoff",
      author: "高橋",
      residentId: "tanaka",
      name: "田中 春子",
      room: "203",
      dateLabel: todayLabel(),
      submittedAt: "06:40",
      confirmedAt: "06:55",
      status: "confirmed",
      priority: "normal",
      notes: "夜間2回覚醒。朝は落ち着いている。",
      progress: [
        { key: "vitals", label: "バイタル", value: "36.5℃" },
        { key: "sleep", label: "睡眠", value: "途中覚醒 2回" },
      ],
      handoff: [{ key: "nextAction", label: "次担当", value: "日中の活気を観察" }],
    },
  ]);
}
