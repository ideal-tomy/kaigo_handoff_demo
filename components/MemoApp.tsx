"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { MicButton, Waveform } from "@/components/MicButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { fieldNeedsFix, residentCanSubmit } from "@/lib/fieldUtils";
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
  const [expandedClipId, setExpandedClipId] = useState<string | null>(null);

  const speech = useSpeechRecognition();
  const processedSpeechRef = useRef("");

  const nextClipIndex = recorded.length;
  const nextClip = MEMO_CLIPS[nextClipIndex] ?? null;
  const allClipsDone = recorded.length >= MEMO_CLIPS.length;
  const activeResident = residents.find((r) => r.id === activeResidentId) ?? residents[0];
  const fields = docTab === "handoff" ? activeResident.handoff : activeResident.progress;
  const canSubmit = allClipsDone && residentCanSubmit(activeResident);

  const runClip = useCallback((clip: MemoClip) => {
    setBusy(true);
    setRecordingClipId(clip.id);
    setExpandedClipId(null);

    setTimeout(() => {
      setResidents((prev) => applyClip(prev, clip));

      const keys = new Set<string>();
      clip.updates.forEach((u) => {
        if (u.highlight) keys.add(`${u.residentId}:${u.doc}:${u.fieldKey}`);
      });
      setHighlightKeys(keys);
      setTimeout(() => setHighlightKeys(new Set()), 1800);

      setRecorded((prev) => [
        ...prev,
        {
          ...clip,
          recordedAt: new Date().toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setRecordingClipId(null);
      setBusy(false);

      const reviewOnHandoff = clip.updates.some(
        (u) => u.residentId === activeResidentId && u.doc === "handoff" && u.needsReview
      );
      if (reviewOnHandoff) setDocTab("handoff");
    }, clip.durationSec * 70 + 500);
  }, [activeResidentId]);

  const handleClipTap = (clip: MemoClip, index: number) => {
    const isRecorded = index < recorded.length;
    if (isRecorded) {
      setExpandedClipId((id) => (id === clip.id ? null : clip.id));
      return;
    }
    if (busy || index !== nextClipIndex) return;
    runClip(clip);
  };

  const handleDockRecord = () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    if (nextClip && !busy) {
      runClip(nextClip);
    }
  };

  useEffect(() => {
    const text = speech.transcript.trim();
    if (!text || speech.listening || busy || !nextClip) return;
    if (processedSpeechRef.current === text) return;
    processedSpeechRef.current = text;
    runClip({ ...nextClip, transcript: text });
  }, [speech.listening, speech.transcript, busy, nextClip, runClip]);

  const updateField = (key: string, value: string) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== activeResidentId) return r;
        const target = docTab === "handoff" ? "handoff" : "progress";
        return {
          ...r,
          [target]: r[target].map((f) =>
            f.key === key ? { ...f, value, needsReview: false } : f
          ),
        };
      })
    );
  };

  const handleSubmit = () => {
    const nextAction =
      activeResident.handoff.find((f) => f.key === "nextAction")?.value ||
      activeResident.progress.find((f) => f.value)?.value ||
      "";
    setInbox((prev) => [
      {
        id: `inbox-${Date.now()}`,
        resident: activeResident.name,
        summary: nextAction,
        priority: activeResident.priority,
        submittedAt: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
    setView("inbox");
  };

  const reset = () => {
    setResidents(createInitialResidents());
    setRecorded([]);
    setActiveResidentId("tanaka");
    setDocTab("progress");
    setView("work");
    setExpandedClipId(null);
    processedSpeechRef.current = "";
    speech.reset();
  };

  return (
    <div className="appShell">
      <AppNav />

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
          <button type="button" className="btnSecondary" onClick={() => setView("work")}>
            戻る
          </button>
          <button type="button" className="btnSecondary" onClick={reset}>
            はじめから
          </button>
        </div>
      ) : (
        <>
          <div className="workBody">
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

            <ul className="clipGrid">
              {MEMO_CLIPS.map((clip, index) => {
                const isRecorded = index < recorded.length;
                const isNext = index === nextClipIndex;
                const isRecording = recordingClipId === clip.id;
                const rec = recorded[index];
                const line = isRecorded
                  ? rec.summaryByResident[activeResidentId] ?? rec.transcript
                  : "";
                return (
                  <li key={clip.id}>
                    <button
                      type="button"
                      className={`clipCell ${isRecorded ? "done" : ""} ${isNext ? "next" : ""} ${isRecording ? "recording" : ""}`}
                      disabled={!isRecorded && (!isNext || busy)}
                      onClick={() => handleClipTap(clip, index)}
                    >
                      <span className="clipTime">{clip.time}</span>
                      {isRecording && <Waveform />}
                      {isRecorded && <span className="clipSummary">{line}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            {expandedClipId && recorded.find((c) => c.id === expandedClipId) && (
              <p className="clipFull">
                {recorded.find((c) => c.id === expandedClipId)?.transcript}
              </p>
            )}
          </div>

          <div className="dock">
            <MicButton
              recording={!!recordingClipId || speech.listening}
              disabled={busy || (!nextClip && !speech.listening)}
              onClick={handleDockRecord}
            />
            {speech.error && <p className="micError">{speech.error}</p>}
            {allClipsDone && (
              <button
                type="button"
                className="btnPrimary"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                提出
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
