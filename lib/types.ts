export type ScenarioId = "fever" | "fall" | "normal";

export type DocumentTab = "handoff" | "progress";

export type DraftStatus = "idle" | "recording" | "transcribing" | "drafting" | "review" | "submitted";

export type InputMode = "sample" | "mic" | "text";

export type Priority = "normal" | "attention" | "urgent";

export type TemplateField = {
  key: string;
  label: string;
  value: string;
  needsReview?: boolean;
  /** 意図的誤抽出: 正しい値 */
  correctValue?: string;
  priority?: Priority;
};

export type HandoffDraft = {
  resident: string;
  unit: string;
  shiftFrom: string;
  shiftTo: string;
  fields: TemplateField[];
  priority: Priority;
  submittedAt?: string;
};

export type ProgressNote = {
  resident: string;
  date: string;
  fields: TemplateField[];
};

export type ScenarioSample = {
  id: ScenarioId;
  label: string;
  description: string;
  audioDurationSec: number;
  transcript: string;
  handoff: Omit<HandoffDraft, "submittedAt">;
  progress: ProgressNote;
};

export type InboxItem = {
  id: string;
  scenarioId: ScenarioId;
  resident: string;
  summary: string;
  priority: Priority;
  submittedAt: string;
  handoff: HandoffDraft;
  progress: ProgressNote;
};

export type DemoContext = {
  unit: string;
  shiftFrom: string;
  shiftTo: string;
  recorder: string;
};

export const DEMO_CONTEXT: DemoContext = {
  unit: "2F さくら",
  shiftFrom: "夜勤 22:00–07:00",
  shiftTo: "日勤へ",
  recorder: "夜勤 佐藤",
};
