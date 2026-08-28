"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { SHIFT_TO, UNIT } from "@/lib/facility";
import { listMine, listRecords, ensureSeed, type SubmittedRecord } from "@/lib/recordsStore";

function RecordCard({ row }: { row: SubmittedRecord }) {
  return (
    <article className="chartPaper submitted recordCard">
      <header className="paperHead">
        <div className="paperHeadTop">
          <p className="paperDocName">{row.kind === "karte" ? "経過記録" : "申し送り"}</p>
          <span className="paperStamp">{row.kind === "karte" ? "記録済" : "提出済"}</span>
        </div>
        <p className="paperMeta">
          {UNIT}　{row.dateLabel}　{SHIFT_TO}　{row.submittedAt}　{row.author}
        </p>
        <div className="paperWho">
          <h2>
            {row.room}　{row.name}　様
          </h2>
        </div>
      </header>
      {row.kind === "karte" ? (
        <>
          {row.quote && (
            <section className="paperSection">
              <h3>本人の言葉</h3>
              <blockquote className="quoteText">{row.quote}</blockquote>
            </section>
          )}
          {row.assessment && (
            <section className="paperSection">
              <h3>アセスメント</h3>
              <p className="paperVal">{row.assessment}</p>
            </section>
          )}
          <section className="paperSection">
            <h3>記録</h3>
            <div className="paperRows">
              {(row.extraFields ?? []).map((f) => (
                <div key={f.key} className="paperRow">
                  <div className="paperKey">{f.label}</div>
                  <div className="paperVal">{f.value}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="paperSection">
            <h3>経過記録</h3>
            <div className="paperRows">
              {row.progress.map((f) => (
                <div key={f.key} className="paperRow">
                  <div className="paperKey">{f.label}</div>
                  <div className="paperVal">{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="paperSection">
            <h3>申し送り</h3>
            <div className="paperRows">
              {row.handoff.map((f) => (
                <div key={f.key} className="paperRow">
                  <div className="paperKey">{f.label}</div>
                  <div className="paperVal">{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <section className="paperSection">
        <h3>備考</h3>
        <p className="paperVal">{row.notes || "—"}</p>
      </section>
    </article>
  );
}

export function RecordsBoard() {
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [rows, setRows] = useState<SubmittedRecord[]>([]);

  useEffect(() => {
    ensureSeed();
    const refresh = () => setRows(scope === "mine" ? listMine() : listRecords());
    refresh();
    window.addEventListener("kaigo-records", refresh);
    return () => window.removeEventListener("kaigo-records", refresh);
  }, [scope]);

  return (
    <div className="appShell">
      <AppNav />
      <div className="workBody workBodyScroll">
        <div className="nameRow">
          <button type="button" className={`nameChip ${scope === "mine" ? "active" : ""}`} onClick={() => setScope("mine")}>
            自分
          </button>
          <button type="button" className={`nameChip ${scope === "all" ? "active" : ""}`} onClick={() => setScope("all")}>
            全体
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="emptyHint">—</p>
        ) : (
          <div className="recordStack">
            {rows.map((row) => (
              <RecordCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
