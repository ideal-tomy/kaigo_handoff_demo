"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { MicButton, Waveform } from "@/components/MicButton";
import { KARTE_RESIDENTS } from "@/lib/karteSessions";
import type { ConversationLine, TemplateField } from "@/lib/types";

export function KarteApp() {
  const [residentId, setResidentId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lines, setLines] = useState<ConversationLine[]>([]);
  const [progress, setProgress] = useState<{
    quote: string;
    assessment: string;
    fields: TemplateField[];
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);

  const resident = KARTE_RESIDENTS.find((r) => r.id === residentId);

  const startRecording = useCallback(() => {
    if (!resident || !consent || recording) return;
    setRecording(true);
    setLines([]);
    setProgress(null);
    setVisibleLineCount(0);

    const session = resident.session;
    let lineIndex = 0;

    const interval = setInterval(() => {
      lineIndex++;
      setVisibleLineCount(lineIndex);
      if (lineIndex >= session.lines.length) {
        clearInterval(interval);
        setTimeout(() => {
          setProgress(session.progress);
          setRecording(false);
        }, 400);
      }
    }, 900);
  }, [resident, consent, recording]);

  const handleRecord = () => {
    if (recording) return;
    if (lines.length === 0) {
      startRecording();
    }
  };

  const displayLines = resident
    ? resident.session.lines.slice(0, visibleLineCount)
    : lines;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setProgress(null);
    setLines([]);
    setVisibleLineCount(0);
    setConsent(false);
    setRecording(false);
  };

  const selectResident = (id: string) => {
    setResidentId(id);
    reset();
  };

  return (
    <div className="appShell">
      <AppNav title="面談記録" />

      <div className="mainGrid">
        <section className="panel">
          <div className="residentTabs">
            {KARTE_RESIDENTS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`residentTab ${residentId === r.id ? "active" : ""}`}
                onClick={() => selectResident(r.id)}
              >
                {r.name.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>

          {resident && (
            <>
              <label className="consentRow">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={submitted || visibleLineCount > 0}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                録音の同意
              </label>

              <div className="micRow">
                <MicButton
                  recording={recording}
                  disabled={!consent || submitted || !!progress}
                  onClick={handleRecord}
                />
                {recording && <Waveform />}
              </div>

              {displayLines.length > 0 && (
                <div className="conversationLog">
                  {displayLines.map((line, i) => (
                    <div
                      key={i}
                      className={`convLine ${line.speaker === "resident" ? "resident" : "staff"}`}
                    >
                      <span className="convSpeaker">
                        {line.speaker === "resident" ? resident.name.split(" ")[1] : "担当"}
                      </span>
                      <span className="convText">{line.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="panel">
          {progress && !submitted ? (
            <>
              <div className="quoteBlock">
                <div className="fieldLabel">本人の言葉</div>
                <blockquote className="quoteText">{progress.quote}</blockquote>
              </div>
              <div className="templateField visible">
                <div className="fieldLabel">アセスメント</div>
                <div className="fieldValue">{progress.assessment}</div>
              </div>
              <div className="templateFields">
                {progress.fields.map((field) => (
                  <div key={field.key} className="templateField visible">
                    <div className="fieldLabel">{field.label}</div>
                    <div className="fieldValue">{field.value}</div>
                  </div>
                ))}
              </div>
              <button type="button" className="btnPrimary" style={{ marginTop: 16 }} onClick={handleSubmit}>
                記録する
              </button>
            </>
          ) : submitted && progress ? (
            <>
              <div className="quoteBlock">
                <div className="fieldLabel">本人の言葉</div>
                <blockquote className="quoteText">{progress.quote}</blockquote>
              </div>
              <div className="templateFields">
                {progress.fields.map((field) => (
                  <div key={field.key} className="templateField visible">
                    <div className="fieldLabel">{field.label}</div>
                    <div className="fieldValue">{field.value}</div>
                  </div>
                ))}
              </div>
              <button type="button" className="btnSecondary" style={{ marginTop: 16 }} onClick={reset}>
                戻る
              </button>
            </>
          ) : null}
        </section>
      </div>

      <div className="backLinkRow">
        <Link href="/">記録</Link>
      </div>
    </div>
  );
}
