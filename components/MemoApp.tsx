"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { MicButton, Waveform } from "@/components/MicButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { allResidentsFixed, fieldNeedsFix } from "@/lib/fieldUtils";
import {
  MEMO_CLIPS,
  applyClip,
  createInitialResidents,
} from "@/lib/memoDay";
import type {
  DocumentTab,
  InboxItem,
  MemoClip,
  RecordedClip,
  ResidentDraft,
} from "@/lib/types";

export function MemoApp() {
  const [view, setView] = useState<"work" | "inbox">("work");
  const [residents, setResidents] = useState<ResidentDraft[]>(createInitialResidents);
  const [recorded, setRecorded] = useState<RecordedClip[]>([]);
  const [recordingClipId, setRecordingClipId] = useState<string | null>(null);
  const [activeResidentId, setActiveResidentId] = useState("tanaka");
  const [docTab, setDocTab] = useState<DocumentTab>("progress");
  const [highlightKeys, setHighlightKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [canSubmit, setCanSubmit] = useState(false);

  const speech = useSpeechRecognition();
  const processedSpeechRef = useRef("");

  const nextClipIndex = recorded.length;
  const nextClip = MEMO_CLIPS[nextClipIndex] ?? null;
  const allClipsDone = recorded.length >= MEMO_CLIPS.length;

  useEffect(() => {
    if (allClipsDone) {
      setCanSubmit(allResidentsFixed(residents));
    }
  }, [allClipsDone, residents]);

  const runClip = useCallback(
    (clip: MemoClip) => {
      setBusy(true);
      setRecordingClipId(clip.id);

      setTimeout(() => {
        setResidents((prev) => applyClip(prev, clip));

        const keys = new Set<string>();
        clip.updates.forEach((u) => {
          if (u.highlight) keys.add(`${u.residentId}:${u.doc}:${u.fieldKey}`);
        });
        setHighlightKeys(keys);
        setTimeout(() => setHighlightKeys(new Set()), 2400);

        setRecorded((prev) => [
          ...prev,
          { ...clip, recordedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) },
        ]);
        setRecordingClipId(null);
        setBusy(false);

        const firstUpdated = clip.updates[0]?.residentId;
        if (firstUpdated) setActiveResidentId(firstUpdated);
      }, clip.durationSec * 80 + 600);
    },
    []
  );

  const handleClipTap = (clip: MemoClip, index: number) => {
    if (busy || index !== nextClipIndex) return;
    runClip(clip);
  };

  useEffect(() => {
    const text = speech.transcript.trim();
    if (!text || speech.listening || busy || !nextClip) return;
    if (processedSpeechRef.current === text) return;
    processedSpeechRef.current = text;
    runClip({ ...nextClip, transcript: text });
  }, [speech.listening, speech.transcript, busy, nextClip, runClip]);

  const activeResident = residents.find((r) => r.id === activeResidentId) ?? residents[0];
  const fields = docTab === "handoff" ? activeResident.handoff : activeResident.progress;

  const updateField = (key: string, value: string) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== activeResidentId) return r;
        const target = docTab === "handoff" ? "handoff" : "progress";
        return {
          ...r,
          [target]: r[target].map((f) => (f.key === key ? { ...f, value } : f)),
        };
      })
    );
  };

  const handleSubmit = () => {
    const urgent = residents.find((r) => r.priority === "urgent") ?? residents[0];
    const nextAction = urgent.handoff.find((f) => f.key === "nextAction")?.value ?? "";
    setInbox([
      {
        id: `inbox-${Date.now()}`,
        resident: urgent.name,
        summary: nextAction,
        priority: urgent.priority,
        submittedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setView("inbox");
  };

  const reset = () => {
    setResidents(createInitialResidents());
    setRecorded([]);
    setActiveResidentId("tanaka");
    setDocTab("progress");
    setCanSubmit(false);
    setView("work");
    processedSpeechRef.current = "";
    speech.reset();
  };

  return (
    <div className="appShell">
      <AppNav title="申し送り" />

      {view === "inbox" ? (
        <div className="inboxPanel">
          <h2 className="inboxTitle">受信</h2>
          <div className="inboxList">
            {inbox.map((item) => (
              <div
                key={item.id}
                className={`inboxItem ${item.priority === "urgent" ? "urgent" : ""}`}
              >
                <div className="inboxItemHeader">
                  <div>
                    <div className="inboxResident">{item.resident}</div>
                    <div className="inboxSummary">{item.summary}</div>
                  </div>
                  <div className="inboxTime">{item.submittedAt}</div>
                </div>
                {item.priority === "urgent" && (
                  <span className="priorityBadge urgent">要対応</span>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btnSecondary" style={{ maxWidth: 280 }} onClick={reset}>
            戻る
          </button>
        </div>
      ) : (
        <div className="mainGrid">
          <section className="panel">
            <ul className="clipList">
              {MEMO_CLIPS.map((clip, index) => {
                const isRecorded = index < recorded.length;
                const isNext = index === nextClipIndex;
                const isRecording = recordingClipId === clip.id;
                const rec = recorded[index];
                return (
                  <li key={clip.id}>
                    <button
                      type="button"
                      className={`clipRow ${isRecorded ? "done" : ""} ${isNext ? "next" : ""} ${isRecording ? "recording" : ""}`}
                      disabled={!isNext || busy}
                      onClick={() => handleClipTap(clip, index)}
                    >
                      <span className="clipTime">{clip.time}</span>
                      {isRecording && <Waveform />}
                      {isRecorded && rec && (
                        <span className="clipTranscript">{rec.transcript}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="micRow">
              <MicButton
                recording={speech.listening}
                disabled={busy || !nextClip}
                onClick={() => (speech.listening ? speech.stop() : speech.start())}
              />
            </div>
            {speech.error && <p className="micError">{speech.error}</p>}
          </section>

          <section className="panel">
            <div className="residentTabs">
              {residents.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`residentTab ${activeResidentId === r.id ? "active" : ""} ${r.priority === "urgent" ? "urgent" : ""}`}
                  onClick={() => setActiveResidentId(r.id)}
                >
                  {r.name.split(" ").slice(0, 2).join(" ")}
                </button>
              ))}
            </div>

            <div className="docTabs">
              <button
                type="button"
                className={`docTab ${docTab === "handoff" ? "active" : ""}`}
                onClick={() => setDocTab("handoff")}
              >
                申し送り票
              </button>
              <button
                type="button"
                className={`docTab ${docTab === "progress" ? "active" : ""}`}
                onClick={() => setDocTab("progress")}
              >
                経過記録
              </button>
            </div>

            <div className="templateFields">
              {fields.map((field) => {
                const hk = `${activeResidentId}:${docTab}:${field.key}`;
                const highlighted = highlightKeys.has(hk);
                const needsFix = fieldNeedsFix(field);
                const hasValue = field.value.length > 0;
                return (
                  <div
                    key={field.key}
                    className={`templateField visible ${needsFix ? "review" : ""} ${field.priority === "urgent" ? "urgent" : ""} ${highlighted ? "flash" : ""} ${!hasValue ? "empty" : ""}`}
                  >
                    <div className="fieldLabel">
                      {field.label}
                      {field.priority === "urgent" && (
                        <span className="priorityBadge urgent">要対応</span>
                      )}
                    </div>
                    {allClipsDone ? (
                      <input
                        className="fieldInput"
                        value={field.value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        aria-label={field.label}
                      />
                    ) : (
                      <div className="fieldValue">{field.value || "—"}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {allClipsDone && (
              <button
                type="button"
                className="btnPrimary"
                style={{ marginTop: 16 }}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                提出
              </button>
            )}
          </section>
        </div>
      )}

      {view === "work" && (
        <div className="backLinkRow">
          <Link href="/">記録</Link>
        </div>
      )}
    </div>
  );
}
