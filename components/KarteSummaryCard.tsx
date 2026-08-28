"use client";

import { SHIFT_TO, UNIT } from "@/lib/facility";
import type { TemplateField } from "@/lib/types";

type Props = {
  room: string;
  name: string;
  dateLabel: string;
  quote: string;
  assessment: string;
  fields: TemplateField[];
  notes: string;
  submitted?: boolean;
};

export function KarteSummaryCard({
  room,
  name,
  dateLabel,
  quote,
  assessment,
  fields,
  notes,
  submitted,
}: Props) {
  return (
    <article className={`summaryCard ${submitted ? "submitted" : ""}`}>
      <header className="summaryHead">
        <div className="summaryHeadTop">
          <p className="summaryDoc">経過記録</p>
          {submitted ? <span className="paperStamp">記録済</span> : null}
        </div>
        <p className="summaryMeta">
          {UNIT}　{dateLabel}　{SHIFT_TO}
        </p>
        <div className="summaryWho">
          <h2>
            {room}　{name}　様
          </h2>
        </div>
      </header>

      <section className="summarySection">
        <h3>本人の言葉</h3>
        <p className="summaryNotes">{quote}</p>
      </section>

      {assessment ? (
        <section className="summarySection">
          <h3>アセスメント</h3>
          <p className="summaryNotes">{assessment}</p>
        </section>
      ) : null}

      {fields.length > 0 && (
        <section className="summarySection">
          <h3>記録</h3>
          {fields.map((f) => (
            <div key={f.key} className="summaryRow">
              <span className="summaryKey">{f.label}</span>
              <span className="summaryVal">{f.value}</span>
            </div>
          ))}
        </section>
      )}

      {notes ? (
        <section className="summarySection">
          <h3>備考</h3>
          <p className="summaryNotes">{notes}</p>
        </section>
      ) : null}
    </article>
  );
}
