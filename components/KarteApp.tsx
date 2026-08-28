"use client";

import { useCallback, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { MicButton, Waveform } from "@/components/MicButton";
import { KARTE_RESIDENTS } from "@/lib/karteSessions";
import type { TemplateField } from "@/lib/types";

export function KarteApp() {
  const [residentId, setResidentId] = useState(KARTE_RESIDENTS[0].id);
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [progress, setProgress] = useState<{
    quote: string;
    assessment: string;
    fields: TemplateField[];
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const resident = KARTE_RESIDENTS.find((r) => r.id === residentId) ?? KARTE_RESIDENTS[0];
  const displayLines = resident.session.lines.slice(0, visibleLineCount);

  const startRecording = useCallback(() => {
    if (!consent || recording || progress || submitted) return;
    setRecording(true);
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
  }, [consent, recording, progress, submitted, resident]);

  const reset = () => {
    setSubmitted(false);
    setProgress(null);
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
      <AppNav />

      <div className="workBody">
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

        <label className="consentRow">
          <input
            type="checkbox"
            checked={consent}
            disabled={submitted || visibleLineCount > 0}
            onChange={(e) => setConsent(e.target.checked)}
          />
          録音の同意
        </label>

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

        {progress && (
          <>
            <div className="quoteBlock">
              <div className="fieldLabel">本人の言葉</div>
              <blockquote className="quoteText">{progress.quote}</blockquote>
            </div>
            {!submitted && (
              <div className="templateField visible">
                <div className="fieldLabel">アセスメント</div>
                <div className="fieldValue">{progress.assessment}</div>
              </div>
            )}
            <div className="templateFields">
              {progress.fields.map((field) => (
                <div key={field.key} className="templateField visible">
                  <div className="fieldLabel">{field.label}</div>
                  <div className="fieldValue">{field.value}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="dock">
        {recording && <Waveform />}
        {!progress && !submitted && (
          <MicButton
            recording={recording}
            disabled={!consent || recording}
            onClick={startRecording}
          />
        )}
        {progress && !submitted && (
          <button type="button" className="btnPrimary" onClick={() => setSubmitted(true)}>
            記録する
          </button>
        )}
        {submitted && (
          <button type="button" className="btnSecondary" onClick={reset}>
            戻る
          </button>
        )}
      </div>
    </div>
  );
}
