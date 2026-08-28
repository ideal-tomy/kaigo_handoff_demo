"use client";

import { useCallback, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { MicButton, Waveform } from "@/components/MicButton";
import { SHIFT_TO, UNIT, todayLabel, nowTime } from "@/lib/facility";
import { KARTE_RESIDENTS } from "@/lib/karteSessions";
import { addKarteRecord } from "@/lib/recordsStore";

export function KarteApp() {
  const [residentId, setResidentId] = useState("tanaka");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");
  const [assessment, setAssessment] = useState("");

  const person = KARTE_RESIDENTS.find((r) => r.id === residentId) ?? KARTE_RESIDENTS[0];
  const lines = person.session.lines.slice(0, visibleLineCount);
  const note = person.session.progress;

  const startRecording = useCallback(() => {
    if (!consent || recording || ready || submitted) return;
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
        setTimeout(() => {
          setAssessment(session.progress.assessment);
          setReady(true);
          setRecording(false);
        }, 350);
      }
    }, 700);
  }, [consent, recording, ready, submitted, person.session]);

  const reset = () => {
    setSubmitted(false);
    setReady(false);
    setVisibleLineCount(0);
    setConsent(false);
    setRecording(false);
    setNotes("");
    setAssessment("");
  };

  const save = () => {
    addKarteRecord({
      residentId: person.id,
      name: person.name,
      room: person.room,
      dateLabel: todayLabel(),
      submittedAt: nowTime(),
      quote: note.quote,
      assessment,
      fields: note.fields,
      notes,
    });
    setSubmitted(true);
  };

  return (
    <div className="appShell">
      <AppNav />

      <div className="workBody">
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

        <label className="consentRow">
          <input
            type="checkbox"
            checked={consent}
            disabled={submitted || visibleLineCount > 0}
            onChange={(e) => setConsent(e.target.checked)}
          />
          録音の同意
        </label>

        {lines.length > 0 && !submitted && (
          <div className="conversationLog">
            {lines.map((line, i) => (
              <div key={i} className={`convLine ${line.speaker}`}>
                <span className="convSpeaker">{line.speaker === "resident" ? person.name.split(" ")[0] : "担当"}</span>
                <span className="convText">{line.text}</span>
              </div>
            ))}
          </div>
        )}

        {(ready || submitted) && (
          <article className={`chartPaper ${submitted ? "submitted" : ""}`}>
            <header className="paperHead">
              <div className="paperHeadTop">
                <p className="paperDocName">経過記録</p>
                {submitted ? <span className="paperStamp">記録済</span> : null}
              </div>
              <p className="paperMeta">
                {UNIT}　{todayLabel()}　{SHIFT_TO}
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
              {ready && !submitted ? (
                <textarea
                  className="fieldArea"
                  rows={3}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  aria-label="アセスメント"
                />
              ) : (
                <p className="paperVal">{assessment || note.assessment}</p>
              )}
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
              {submitted ? (
                <p className="paperVal">{notes || "—"}</p>
              ) : (
                <textarea
                  className="fieldArea notesArea"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  aria-label="備考"
                />
              )}
            </section>
          </article>
        )}
      </div>

      <div className="dock">
        {recording && <Waveform />}
        {!ready && !submitted && (
          <MicButton recording={recording} disabled={!consent || recording} onClick={startRecording} />
        )}
        {ready && !submitted && (
          <button type="button" className="btnPrimary" onClick={save}>
            記録する
          </button>
        )}
        {submitted && (
          <>
            <a href="/records" className="btnPrimary dockLink">
              記録
            </a>
            <button type="button" className="btnSecondary" onClick={reset}>
              戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}
