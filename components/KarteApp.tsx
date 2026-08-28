"use client";

import { useCallback, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { BottomSheet } from "@/components/BottomSheet";
import { KarteSummaryCard } from "@/components/KarteSummaryCard";
import { MicButton, Waveform } from "@/components/MicButton";
import { Spinner } from "@/components/Spinner";
import { SHIFT_TO, UNIT, todayLabel, nowTime } from "@/lib/facility";
import { KARTE_RESIDENTS } from "@/lib/karteSessions";
import { addKarteRecord } from "@/lib/recordsStore";

export function KarteApp() {
  const [residentId, setResidentId] = useState("tanaka");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [writing, setWriting] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");
  const [assessment, setAssessment] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewFade, setViewFade] = useState(false);

  const person = KARTE_RESIDENTS.find((r) => r.id === residentId) ?? KARTE_RESIDENTS[0];
  const lines = person.session.lines.slice(0, visibleLineCount);
  const note = person.session.progress;
  const lastLine = lines.at(-1);
  const dateLabel = todayLabel();

  const startRecording = useCallback(() => {
    if (!consent || recording || ready || submitted || writing) return;
    setRecording(true);
    setReady(false);
    setVisibleLineCount(0);

    const session = person.session;
    let n = 0;
    const interval = setInterval(() => {
      n += 1;
      setVisibleLineCount(n);
      if (n >= session.lines.length) {
        clearInterval(interval);
        setRecording(false);
        setWriting(true);
        setTimeout(() => {
          setAssessment(session.progress.assessment);
          setReady(true);
          setWriting(false);
        }, 500);
      }
    }, 700);
  }, [consent, recording, ready, submitted, writing, person.session]);

  const reset = () => {
    setSubmitted(false);
    setReady(false);
    setVisibleLineCount(0);
    setConsent(false);
    setRecording(false);
    setWriting(false);
    setNotes("");
    setAssessment("");
  };

  const save = () => {
    addKarteRecord({
      residentId: person.id,
      name: person.name,
      room: person.room,
      dateLabel,
      submittedAt: nowTime(),
      quote: note.quote,
      assessment,
      fields: note.fields,
      notes,
    });
    setViewFade(true);
    setTimeout(() => {
      setSubmitted(true);
      setViewFade(false);
    }, 220);
  };

  const statusText = (() => {
    if (submitted) return "記録済";
    if (recording) return lastLine?.text ?? "録音中";
    if (writing) return "経過を書き込み中…";
    if (ready) return "記録できます";
    if (!consent) return "同意にチェック";
    return "面談を録音";
  })();

  const nameRow = (
    <div className="nameRow">
      {KARTE_RESIDENTS.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`nameChip ${residentId === r.id ? "active" : ""}`}
          onClick={() => {
            setResidentId(r.id);
            reset();
          }}
        >
          {r.room} {r.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );

  const fullKarte = (
    <article className="chartPaper">
      <header className="paperHead">
        <div className="paperHeadTop">
          <p className="paperDocName">経過記録</p>
        </div>
        <p className="paperMeta">
          {UNIT}　{dateLabel}　{SHIFT_TO}
        </p>
        <div className="paperWho">
          <h2>
            {person.room}　{person.name}　様
          </h2>
        </div>
      </header>
      <section className="paperSection">
        <h3>本人の言葉</h3>
        <blockquote className="quoteText">{note.quote}</blockquote>
      </section>
      <section className="paperSection">
        <h3>アセスメント</h3>
        <textarea
          className="fieldArea"
          rows={3}
          value={assessment}
          onChange={(e) => setAssessment(e.target.value)}
          aria-label="アセスメント"
          disabled={submitted}
        />
      </section>
      <section className="paperSection">
        <h3>記録</h3>
        <div className="paperRows">
          {note.fields.map((field) => (
            <div key={field.key} className="paperRow">
              <div className="paperKey">{field.label}</div>
              <div className="paperVal">{field.value}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="paperSection">
        <h3>備考</h3>
        <textarea
          className="fieldArea notesArea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="備考"
          disabled={submitted}
        />
      </section>
    </article>
  );

  return (
    <div className="appShell">
      <AppNav />

      <div className={`workBody ${viewFade ? "viewFade" : ""}`}>
        {submitted ? (
          <div className="workMain workMainConfirm">
            {nameRow}
            <p className="statusLine statusLineDone">{statusText}</p>
            <KarteSummaryCard
              room={person.room}
              name={person.name}
              dateLabel={dateLabel}
              quote={note.quote}
              assessment={assessment || note.assessment}
              fields={note.fields}
              notes={notes}
              submitted
            />
            <button type="button" className="textLink" onClick={() => setSheetOpen(true)}>
              カルテを見る
            </button>
            <button type="button" className="textLink textLinkMuted" onClick={reset}>
              戻る
            </button>
          </div>
        ) : (
          <div className="workMain">
            {nameRow}
            <label className="consentRow consentRowCompact">
              <input
                type="checkbox"
                checked={consent}
                disabled={visibleLineCount > 0}
                onChange={(e) => setConsent(e.target.checked)}
              />
              録音の同意
            </label>
            <p className={`statusLine ${recording ? "statusLineRec" : ""}`} title={statusText}>
              {statusText}
            </p>

            {ready ? (
              <>
                <KarteSummaryCard
                  room={person.room}
                  name={person.name}
                  dateLabel={dateLabel}
                  quote={note.quote}
                  assessment={assessment}
                  fields={note.fields}
                  notes={notes}
                />
                <button type="button" className="textLink" onClick={() => setSheetOpen(true)}>
                  カルテを見る
                </button>
              </>
            ) : recording && lastLine ? (
              <div className="convPreview">
                <span className="convSpeaker">
                  {lastLine.speaker === "resident" ? person.name.split(" ")[0] : "担当"}
                </span>
                <span className="convText">{lastLine.text}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="dock dockSingle">
        {!submitted && !ready && !writing && (
          <>
            {recording && <Waveform />}
            <MicButton recording={recording} disabled={!consent || recording} onClick={startRecording} />
          </>
        )}
        {writing && (
          <button type="button" className="btnPrimary btnBusy" disabled>
            <Spinner />
            書き込み中…
          </button>
        )}
        {ready && !submitted && (
          <button type="button" className="btnPrimary" onClick={save}>
            記録する
          </button>
        )}
        {submitted && (
          <a href="/records" className="btnPrimary dockLink">
            記録
          </a>
        )}
      </div>

      <BottomSheet open={sheetOpen} title="面談カルテ" onClose={() => setSheetOpen(false)}>
        {fullKarte}
      </BottomSheet>
    </div>
  );
}
