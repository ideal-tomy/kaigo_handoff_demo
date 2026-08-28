export type DocumentTab = "handoff" | "progress";

export type Priority = "normal" | "attention" | "urgent";

export type TemplateField = {
  key: string;
  label: string;
  value: string;
  needsReview?: boolean;
  correctValue?: string;
  priority?: Priority;
};

export type ResidentDraft = {
  id: string;
  name: string;
  handoff: TemplateField[];
  progress: TemplateField[];
  priority: Priority;
};

export type MemoClip = {
  id: string;
  time: string;
  transcript: string;
  durationSec: number;
  updates: Array<{
    residentId: string;
    doc: DocumentTab;
    fieldKey: string;
    value: string;
    needsReview?: boolean;
    correctValue?: string;
    priority?: Priority;
    highlight?: boolean;
  }>;
  setHandoffPriority?: { residentId: string; priority: Priority };
  setNextAction?: { residentId: string; value: string; priority?: Priority };
};

export type RecordedClip = MemoClip & {
  recordedAt: string;
};

export type InboxItem = {
  id: string;
  resident: string;
  summary: string;
  priority: Priority;
  submittedAt: string;
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
  session: KarteSession;
};
