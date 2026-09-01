export type DocumentTab = "handoff" | "progress";

export type Priority = "normal" | "attention" | "urgent";

export type TemplateField = {
  key: string;
  label: string;
  value: string;
  needsReview?: boolean;
  correctValue?: string;
  priority?: Priority;
  sourceLine?: number;
};

export type ResidentDraft = {
  id: string;
  name: string;
  room: string;
  handoff: TemplateField[];
  progress: TemplateField[];
  notes: string;
  priority: Priority;
};

export type FieldPatch = {
  doc: DocumentTab;
  fieldKey: string;
  value: string;
  needsReview?: boolean;
  correctValue?: string;
  priority?: Priority;
};

export type MemoClip = {
  id: string;
  residentId: string;
  time: string;
  transcript: string;
  summary: string;
  durationSec: number;
  patches: FieldPatch[];
  setPriority?: Priority;
};

export type RecordedClip = MemoClip & {
  recordedAt: string;
};

export type ConversationLine = {
  speaker: "staff" | "resident";
  text: string;
};

export type KarteSession = {
  id: string;
  residentName: string;
  lines: ConversationLine[];
  durationSec: number;
  progress: {
    quote: string;
    assessment: string;
    fields: TemplateField[];
  };
};

export type KarteResident = {
  id: string;
  name: string;
  room: string;
  session: KarteSession;
};
