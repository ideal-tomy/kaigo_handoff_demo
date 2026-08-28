"use client";

import { fieldNeedsFix } from "@/lib/fieldUtils";
import { SHIFT_TO, UNIT } from "@/lib/facility";
import type { ResidentDraft, TemplateField } from "@/lib/types";

type Props = {
  resident: ResidentDraft;
  dateLabel: string;
  submitted?: boolean;
  highlightKeys?: Set<string>;
};

function Row({
  field,
  docKey,
  highlightKeys,
}: {
  field: TemplateField;
  docKey: string;
  highlightKeys?: Set<string>;
}) {
  if (!field.value) return null;
  const review = fieldNeedsFix(field);
  const flash = highlightKeys?.has(`${docKey}:${field.key}`);
  return (
    <div
      className={`summaryRow ${review ? "review" : ""} ${field.priority === "urgent" ? "urgent" : ""} ${flash ? "flash" : ""}`}
    >
      <span className="summaryKey">{field.label}</span>
      <span className="summaryVal">{field.value}</span>
    </div>
  );
}

export function SummaryCard({ resident, dateLabel, submitted, highlightKeys }: Props) {
  const pending = [...resident.handoff, ...resident.progress].filter(fieldNeedsFix);
  const filledProgress = resident.progress.filter((f) => f.value);
  const filledHandoff = resident.handoff.filter((f) => f.value);

  return (
    <article className={`summaryCard ${submitted ? "submitted" : ""}`}>
      <header className="summaryHead">
        <div className="summaryHeadTop">
          <p className="summaryDoc">申し送り</p>
          {submitted ? <span className="paperStamp">提出済</span> : null}
        </div>
        <p className="summaryMeta">
          {UNIT}　{dateLabel}　{SHIFT_TO}
        </p>
        <div className="summaryWho">
          <h2>
            {resident.room}　{resident.name}　様
          </h2>
          {pending.length > 0 && !submitted ? (
            <span className="priorityBadge urgent">要対応</span>
          ) : null}
        </div>
      </header>

      {filledProgress.length > 0 && (
        <section className="summarySection">
          <h3>経過記録</h3>
          {filledProgress.map((f) => (
            <Row key={f.key} field={f} docKey="progress" highlightKeys={highlightKeys} />
          ))}
        </section>
      )}

      {filledHandoff.length > 0 && (
        <section className="summarySection">
          <h3>申し送り</h3>
          {filledHandoff.map((f) => (
            <Row key={f.key} field={f} docKey="handoff" highlightKeys={highlightKeys} />
          ))}
        </section>
      )}

      {resident.notes ? (
        <section className="summarySection">
          <h3>備考</h3>
          <p className="summaryNotes">{resident.notes}</p>
        </section>
      ) : null}
    </article>
  );
}
