"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KartePaper } from "@/components/KartePaper";
import { MicButton } from "@/components/MicButton";
import { RecHud } from "@/components/RecHud";
import { Spinner } from "@/components/Spinner";
import { StaffShell } from "@/components/StaffShell";
import { useDemoDate } from "@/hooks/useDemoDate";
import { fieldNeedsFix } from "@/lib/fieldUtils";
import { nowTime } from "@/lib/facility";
import { KARTE_RESIDENTS, karteInputSummary } from "@/lib/karteSessions";
import { addKarteRecord } from "@/lib/recordsStore";
import { printSheet } from "@/lib/print";
import type { ConversationLine, TemplateField } from "@/lib/types";

const CHAR_MS = 100;
const END_MS = 780;
const START_MS = 220;
const FILL_MS = 580;

function cloneFields(fields: TemplateField[]) {
  return fields.map((f) => ({ ...f }));
}

export function KarteApp() {
  const [residentId, setResidentId] = useState("tanaka");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [writing, setWriting] = useState(false);
  const [log, setLog] = useState<ConversationLine[]>([]);
  const [draft, setDraft] = useState<ConversationLine | null>(null);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");
  const [assessment, setAssessment] = useState("");
  const [fields, setFields] = useState<TemplateField[]>(() =>
    cloneFields(KARTE_RESIDENTS[0].session.progress.fields)
  );
  const [showQuote, setShowQuote] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [highlightKeys, setHighlightKeys] = useState<Set<string>>(new Set());
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [viewFade, setViewFade] = useState(false);
  const [inputText, setInputText] = useState("");
  const [typingInput, setTypingInput] = useState(false);
  const cancelRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);

  const person = KARTE_RESIDENTS.find((r) => r.id === residentId) ?? KARTE_RESIDENTS[0];
  const note = person.session.progress;
  const dateLabel = useDemoDate();
  const firstReview = ready ? fields.find(fieldNeedsFix) : undefined;
  const displayFields = fields.map((f) =>
    revealedKeys.has(f.key) ? f : { ...f, value: "", needsReview: false, priority: undefined }
  );

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    setRecSeconds(0);
    const id = window.setInterval(() => {
      setRecSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const hardReset = (nextId = residentId) => {
    cancelRef.current = true;
    clearTimers();
    const next = KARTE_RESIDENTS.find((r) => r.id === nextId) ?? KARTE_RESIDENTS[0];
    setResidentId(next.id);
    setSubmitted(false);
    setReady(false);
    setLog([]);
    setDraft(null);
    setConsent(false);
    setRecording(false);
    setWriting(false);
    setNotes("");
    setAssessment("");
    setFields(cloneFields(next.session.progress.fields));
    setShowQuote(false);
    setRevealedKeys(new Set());
    setHighlightKeys(new Set());
    setHighlightLine(null);
    setInterviewOpen(false);
    setRecSeconds(0);
    setInputText("");
    setTypingInput(false);
  };

  const beginWriting = useCallback(
    (fullLog: ConversationLine[]) => {
      const session = person.session;
      setDraft(null);
      setLog(fullLog);
      setRecording(false);
      setWriting(true);
      setInterviewOpen(true);
      setShowQuote(false);
      setRevealedKeys(new Set());
      setAssessment("");
      setFields(cloneFields(session.progress.fields));
      setHighlightLine(null);

      const keys = session.progress.fields.map((f) => f.key);
      const total = keys.length + 2;
      let step = 0;

      const run = () => {
        if (cancelRef.current) return;
        if (step === 0) {
          setShowQuote(true);
          setHighlightKeys(new Set(["quote"]));
          setHighlightLine(null);
        } else if (step <= keys.length) {
          const field = session.progress.fields[step - 1];
          setRevealedKeys((prev) => new Set(prev).add(field.key));
          setHighlightKeys(new Set([field.key]));
          setHighlightLine(field.sourceLine ?? null);
        } else {
          setAssessment(session.progress.assessment);
          setHighlightKeys(new Set(["assessment"]));
          setHighlightLine(null);
        }

        const current = step;
        step += 1;
        later(() => {
          setHighlightKeys(new Set());
          if (current + 1 >= total) {
            setWriting(false);
            setReady(true);
            setInterviewOpen(false);
            setHighlightLine(null);
            later(() => {
              mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }, 40);
          } else {
            run();
          }
        }, FILL_MS);
      };

      later(run, 480);
    },
    [person.session]
  );

  const startRecording = useCallback(() => {
    if (!consent || recording || ready || submitted || writing) return;
    cancelRef.current = false;
    clearTimers();
    setRecording(true);
    setReady(false);
    setLog([]);
    setDraft(null);
    setShowQuote(false);
    setRevealedKeys(new Set());
    setAssessment("");
    setInterviewOpen(false);

    const lines = person.session.lines;

    const playLine = (index: number, acc: ConversationLine[]) => {
      if (cancelRef.current) return;
      if (index >= lines.length) {
        beginWriting(acc);
        return;
      }

      const line = lines[index];
      let i = 0;
      const tick = () => {
        if (cancelRef.current) return;
        i += 1;
        setDraft({ speaker: line.speaker, text: line.text.slice(0, i) });
        if (i >= line.text.length) {
          const next = [...acc, line];
          setLog(next);
          setDraft(null);
          later(() => playLine(index + 1, next), END_MS);
        } else {
          later(tick, CHAR_MS);
        }
      };
      later(tick, index === 0 ? 400 : START_MS);
    };

    playLine(0, []);
  }, [consent, recording, ready, submitted, writing, person.session.lines, beginWriting]);

  const stopRecording = () => {
    if (!recording) return;
    clearTimers();
    cancelRef.current = false;
    beginWriting(person.session.lines);
  };

  const startInput = () => {
    if (recording || writing || ready || submitted || typingInput) return;
    cancelRef.current = false;
    clearTimers();
    setTypingInput(true);
    setInputText("");
    setLog([]);
    setDraft(null);
    setInterviewOpen(false);

    const text = karteInputSummary(person.id);
    let i = 0;
    const tick = () => {
      if (cancelRef.current) return;
      i += 1;
      setInputText(text.slice(0, i));
      if (i >= text.length) {
        later(() => {
          setTypingInput(false);
          beginWriting(person.session.lines);
          later(() => setInputText(""), 600);
        }, 480);
      } else {
        later(tick, 42);
      }
    };
    later(tick, 200);
  };

  const confirmField = (key: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.key === key
          ? { ...f, value: f.correctValue ?? f.value, needsReview: false }
          : f
      )
    );
  };

  const save = () => {
    if (fields.some(fieldNeedsFix)) return;
    addKarteRecord({
      residentId: person.id,
      name: person.name,
      room: person.room,
      dateLabel,
      submittedAt: nowTime(),
      quote: note.quote,
      assessment,
      fields,
      notes,
    });
    setViewFade(true);
    setTimeout(() => {
      setSubmitted(true);
      setViewFade(false);
    }, 220);
  };

  const paper = (
    <KartePaper
      room={person.room}
      name={person.name}
      dateLabel={dateLabel}
      quote={showQuote ? note.quote : ""}
      assessment={assessment}
      fields={displayFields}
      notes={notes}
      submitted={submitted}
      allowEdit={ready && !submitted}
      highlightKeys={highlightKeys}
      highlightLine={highlightLine}
      lines={log}
      interviewOpen={interviewOpen}
      onToggleInterview={() => setInterviewOpen((open) => !open)}
      onAssessmentChange={setAssessment}
      onNotesChange={setNotes}
      onConfirm={confirmField}
    />
  );

  return (
    <>
    <StaffShell
      recording={recording}
      body={
      <div className={`workBody ${viewFade ? "viewFade" : ""} ${recording ? "karteRecBody" : ""}`}>
        <div ref={mainRef} className={`workMain ${recording ? "karteRecMain" : "karteMain"}`}>
          <div className="nameRow">
            {KARTE_RESIDENTS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`nameChip ${residentId === r.id ? "active" : ""}`}
                onClick={() => hardReset(r.id)}
              >
                {r.room} {r.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {recording ? (
            <RecHud
              seconds={recSeconds}
              draft={draft}
              lines={log}
              residentName={person.name}
              onStop={stopRecording}
            />
          ) : (
            <>
              {typingInput || inputText ? <p className="liveSpeech">{inputText}</p> : null}
              {paper}
            </>
          )}
        </div>
      </div>
      }
      dock={
      <div className="dock dockSingle">
        {!consent && !recording && !writing && !ready && !submitted && !typingInput && (
          <div className="dockDual">
            <button type="button" className="btnPrimary" onClick={() => setConsent(true)}>
              録音の同意
            </button>
            <button type="button" className="btnSecondary" onClick={startInput}>
              入力
            </button>
          </div>
        )}

        {consent && !submitted && !ready && !writing && !typingInput && (
          <div className="dockDual">
            <MicButton recording={recording} onClick={recording ? stopRecording : startRecording} />
            <button type="button" className="btnSecondary" disabled={recording} onClick={startInput}>
              入力
            </button>
          </div>
        )}

        {writing && (
          <button type="button" className="btnPrimary btnBusy" disabled>
            <Spinner />
            清書中…
          </button>
        )}

        {ready && !submitted && firstReview && (
          <button type="button" className="btnPrimary btnConfirm" onClick={() => confirmField(firstReview.key)}>
            確認
          </button>
        )}

        {ready && !submitted && !firstReview && (
          <button type="button" className="btnPrimary" onClick={save}>
            記録する
          </button>
        )}

        {submitted && (
          <div className="dockTriple">
            <button type="button" className="btnSecondary" onClick={() => printSheet("karte")}>
              印刷
            </button>
            <a href="/nippo" className="btnPrimary dockLink">
              日報
            </a>
            <button type="button" className="btnSecondary dockTripleFull" onClick={() => hardReset()}>
              戻る
            </button>
          </div>
        )}
      </div>
      }
    />
    {submitted ? (
      <div className="printSheet printSheetKarte" aria-hidden>
        <KartePaper
          room={person.room}
          name={person.name}
          dateLabel={dateLabel}
          quote={note.quote}
          assessment={assessment}
          fields={fields}
          notes={notes}
          submitted
          lines={log}
          interviewOpen={false}
        />
      </div>
    ) : null}
    </>
  );
}
