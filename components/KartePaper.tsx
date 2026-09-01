"use client";

import { ConversationLog } from "@/components/ConversationLog";
import { fieldNeedsFix } from "@/lib/fieldUtils";
import { SHIFT_TO, UNIT } from "@/lib/facility";
import type { ConversationLine, TemplateField } from "@/lib/types";

type Props = {
  room: string;
  name: string;
  dateLabel: string;
  quote: string;
  assessment: string;
  fields: TemplateField[];
  notes: string;
  submitted?: boolean;
  allowEdit?: boolean;
  highlightKeys?: Set<string>;
  highlightLine?: number | null;
  lines?: ConversationLine[];
  interviewOpen?: boolean;
  onToggleInterview?: () => void;
  onAssessmentChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  onConfirm?: (key: string) => void;
};

export function KartePaper({
  room,
  name,
  dateLabel,
  quote,
  assessment,
  fields,
  notes,
  submitted,
  allowEdit,
  highlightKeys,
  highlightLine,
  lines,
  interviewOpen,
  onToggleInterview,
  onAssessmentChange,
  onNotesChange,
  onConfirm,
}: Props) {
  const hasInterview = (lines?.length ?? 0) > 0;

  return (
    <article className={`chartPaper kartePaper ${submitted ? "submitted" : ""}`}>
      <header className="paperHead">
        <div className="paperHeadTop">
          <p className="paperDocName">経過記録</p>
          {submitted ? <span className="paperStamp">記録済</span> : null}
        </div>
        <p className="paperMeta">
          {UNIT}　{dateLabel}　{SHIFT_TO}
        </p>
        <div className="paperWho">
          <h2>
            {room}　{name}　様
          </h2>
        </div>
      </header>

      {hasInterview ? (
        <section className="paperSection">
          <button type="button" className="interviewToggle" onClick={onToggleInterview}>
            面談
          </button>
          {interviewOpen ? (
            <ConversationLog
              lines={lines ?? []}
              residentName={name}
              compact
              highlightIndex={highlightLine}
            />
          ) : null}
        </section>
      ) : null}

      <section className={`paperSection ${highlightKeys?.has("quote") ? "karteFlash" : ""}`}>
        <h3>本人の言葉</h3>
        <blockquote className={`quoteText ${quote ? "hero" : "empty"}`}>{quote || "—"}</blockquote>
      </section>

      <section className={`paperSection ${highlightKeys?.has("assessment") ? "karteFlash" : ""}`}>
        <h3>アセスメント</h3>
        {allowEdit ? (
          <textarea
            className="fieldArea"
            rows={4}
            value={assessment}
            onChange={(e) => onAssessmentChange?.(e.target.value)}
            aria-label="アセスメント"
            disabled={submitted}
          />
        ) : (
          <p className={`paperVal ${assessment ? "" : "emptyVal"}`}>{assessment || "—"}</p>
        )}
      </section>

      <section className="paperSection">
        <h3>記録</h3>
        <div className="paperRows">
          {fields.map((field) => {
            const review = fieldNeedsFix(field);
            const empty = !field.value;
            const flash = highlightKeys?.has(field.key);
            return (
              <div
                key={field.key}
                className={`paperRow ${empty ? "empty" : ""} ${review ? "review" : ""} ${field.priority === "urgent" ? "urgent" : ""} ${field.priority === "attention" && !review ? "attention" : ""} ${flash ? "flash" : ""}`}
              >
                <div className="paperKey">
                  {field.label}
                  {review ? <span className="priorityBadge urgent">要対応</span> : null}
                </div>
                <div className="paperValWrap">
                  <div className="paperVal">{field.value || "—"}</div>
                  {allowEdit && review && (
                    <button type="button" className="confirmBtn" onClick={() => onConfirm?.(field.key)}>
                      確認
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="paperSection">
        <h3>備考</h3>
        {allowEdit ? (
          <textarea
            className="fieldArea notesArea"
            rows={3}
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            aria-label="備考"
            disabled={submitted}
          />
        ) : (
          <p className={`paperVal ${notes ? "" : "emptyVal"}`}>{notes || "—"}</p>
        )}
      </section>
    </article>
  );
}
