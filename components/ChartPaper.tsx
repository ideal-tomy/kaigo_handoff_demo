"use client";

import { fieldNeedsFix } from "@/lib/fieldUtils";
import { SHIFT_TO, UNIT } from "@/lib/facility";
import type { ResidentDraft, TemplateField } from "@/lib/types";

type Props = {
  resident: ResidentDraft;
  dateLabel: string;
  submitted?: boolean;
  allowEdit?: boolean;
  highlightKeys?: Set<string>;
  onEdit?: (doc: "handoff" | "progress", key: string, value: string) => void;
  onConfirm?: (doc: "handoff" | "progress", key: string) => void;
  onNotes?: (value: string) => void;
};

function Rows({
  fields,
  doc,
  allowEdit,
  highlightKeys,
  onEdit,
  onConfirm,
}: {
  fields: TemplateField[];
  doc: "handoff" | "progress";
  allowEdit?: boolean;
  highlightKeys?: Set<string>;
  onEdit?: Props["onEdit"];
  onConfirm?: Props["onConfirm"];
}) {
  return (
    <div className="paperRows">
      {fields.map((field) => {
        const flash = highlightKeys?.has(`${doc}:${field.key}`);
        const review = fieldNeedsFix(field);
        const empty = !field.value;
        const long = field.key === "nextAction" || field.key === "notes";
        return (
          <div
            key={field.key}
            className={`paperRow ${long ? "long" : ""} ${review ? "review" : ""} ${field.priority === "urgent" ? "urgent" : ""} ${flash ? "flash" : ""} ${empty ? "empty" : ""}`}
          >
            <div className="paperKey">
              {field.label}
              {review && <span className="priorityBadge urgent">要対応</span>}
            </div>
            <div className="paperValWrap">
              {allowEdit ? (
                long ? (
                  <textarea
                    className="fieldArea"
                    rows={3}
                    value={field.value}
                    onChange={(e) => onEdit?.(doc, field.key, e.target.value)}
                    aria-label={field.label}
                  />
                ) : (
                  <input
                    className="fieldInput"
                    value={field.value}
                    onChange={(e) => onEdit?.(doc, field.key, e.target.value)}
                    aria-label={field.label}
                  />
                )
              ) : (
                <div className="paperVal">{field.value || "—"}</div>
              )}
              {allowEdit && review && (
                <button
                  type="button"
                  className="confirmBtn"
                  onClick={() => onConfirm?.(doc, field.key)}
                >
                  確認
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChartPaper({
  resident,
  dateLabel,
  submitted,
  allowEdit,
  highlightKeys,
  onEdit,
  onConfirm,
  onNotes,
}: Props) {
  const pending = resident.handoff.some(fieldNeedsFix) || resident.progress.some(fieldNeedsFix);

  return (
    <article className={`chartPaper ${submitted ? "submitted" : ""}`}>
      <header className="paperHead">
        <div className="paperHeadTop">
          <p className="paperDocName">申し送り</p>
          {submitted ? <span className="paperStamp">提出済</span> : null}
        </div>
        <p className="paperMeta">
          {UNIT}　{dateLabel}　{SHIFT_TO}
        </p>
        <div className="paperWho">
          <h2>
            {resident.room}　{resident.name}　様
          </h2>
          {pending && !submitted ? <span className="priorityBadge urgent">要対応</span> : null}
        </div>
      </header>

      <section className="paperSection">
        <h3>経過記録</h3>
        <Rows
          fields={resident.progress}
          doc="progress"
          allowEdit={allowEdit}
          highlightKeys={highlightKeys}
          onEdit={onEdit}
          onConfirm={onConfirm}
        />
      </section>

      <section className="paperSection">
        <h3>申し送り</h3>
        <Rows
          fields={resident.handoff}
          doc="handoff"
          allowEdit={allowEdit}
          highlightKeys={highlightKeys}
          onEdit={onEdit}
          onConfirm={onConfirm}
        />
      </section>

      <section className="paperSection">
        <h3>備考</h3>
        {allowEdit ? (
          <textarea
            className="fieldArea notesArea"
            rows={4}
            value={resident.notes}
            onChange={(e) => onNotes?.(e.target.value)}
            aria-label="備考"
          />
        ) : (
          <p className="paperVal">{resident.notes || "—"}</p>
        )}
      </section>
    </article>
  );
}
