"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { ChartPaper } from "@/components/ChartPaper";
import { MicButton, Waveform } from "@/components/MicButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { residentCanSubmit } from "@/lib/fieldUtils";
import { todayLabel, nowTime } from "@/lib/facility";
import {
  applyClip,
  createInitialResidents,
  getClips,
} from "@/lib/memoDay";
import { addHandoffRecord } from "@/lib/recordsStore";
import type { MemoClip, RecordedClip, ResidentDraft } from "@/lib/types";

type RecordMap = Record<string, RecordedClip[]>;

export function MemoApp() {
  const [residents, setResidents] = useState<ResidentDraft[]>(createInitialResidents);
  const [activeId, setActiveId] = useState("tanaka");
  const [recordedMap, setRecordedMap] = useState<RecordMap>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [spoken, setSpoken] = useState("");
  const [highlightKeys, setHighlightKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  const speech = useSpeechRecognition();
  const processedSpeechRef = useRef("");

  const resident = residents.find((r) => r.id === activeId) ?? residents[0];
  const clips = getClips(resident.id);
  const recorded = recordedMap[resident.id] ?? [];
  const nextIndex = recorded.length;
  const nextClip = clips[nextIndex] ?? null;
  const allDone = recorded.length >= clips.length;
  const submitted = submittedIds.includes(resident.id);
  const canSubmit = allDone && !submitted && residentCanSubmit(resident);
  const dateLabel = todayLabel();

  const runClip = useCallback(
    (clip: MemoClip) => {
      setBusy(true);
      setRecordingId(clip.id);
      setSpoken("");

      let i = 0;
      const typeTimer = setInterval(() => {
        i += 1;
        setSpoken(clip.transcript.slice(0, i));
        if (i >= clip.transcript.length) clearInterval(typeTimer);
      }, 28);

      setTimeout(() => {
        clearInterval(typeTimer);
        setSpoken(clip.transcript);
        setResidents((prev) =>
          prev.map((r) => (r.id === clip.residentId ? applyClip(r, clip) : r))
        );

        const keys = new Set(clip.patches.map((p) => `${p.doc}:${p.fieldKey}`));
        setHighlightKeys(keys);
        setTimeout(() => setHighlightKeys(new Set()), 1600);

        setRecordedMap((prev) => ({
          ...prev,
          [clip.residentId]: [...(prev[clip.residentId] ?? []), { ...clip, recordedAt: clip.time }],
        }));
        setRecordingId(null);
        setBusy(false);
      }, Math.max(clip.transcript.length * 28 + 200, clip.durationSec * 80 + 400));
    },
    []
  );

  const handleSlot = (clip: MemoClip, index: number) => {
    if (submitted || busy) return;
    if (index === nextIndex) runClip(clip);
  };

  const handleRecord = () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    if (nextClip && !busy && !submitted) runClip(nextClip);
  };

  useEffect(() => {
    const text = speech.transcript.trim();
    if (!text || speech.listening || busy || !nextClip || submitted) return;
    if (processedSpeechRef.current === text) return;
    processedSpeechRef.current = text;
    runClip({ ...nextClip, transcript: text });
  }, [speech.listening, speech.transcript, busy, nextClip, runClip, submitted]);

  const onEdit = (doc: "handoff" | "progress", key: string, value: string) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== activeId) return r;
        return {
          ...r,
          [doc]: r[doc].map((f) =>
            f.key === key ? { ...f, value, needsReview: false } : f
          ),
        };
      })
    );
  };

  const onConfirm = (doc: "handoff" | "progress", key: string) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== activeId) return r;
        const next = {
          ...r,
          [doc]: r[doc].map((f) => {
            if (f.key !== key) return f;
            return {
              ...f,
              value: f.correctValue ?? f.value,
              needsReview: false,
              priority: undefined,
            };
          }),
        };
        const still = [...next.handoff, ...next.progress].some((f) => f.needsReview);
        return { ...next, priority: still ? next.priority : "normal" };
      })
    );
  };

  const onNotes = (value: string) => {
    setResidents((prev) => prev.map((r) => (r.id === activeId ? { ...r, notes: value } : r)));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    addHandoffRecord(resident, dateLabel, nowTime());
    setSubmittedIds((prev) => [...prev, resident.id]);
    setSpoken("");
  };

  const resetAll = () => {
    setResidents(createInitialResidents());
    setRecordedMap({});
    setSpoken("");
    setSubmittedIds([]);
    setActiveId("tanaka");
    processedSpeechRef.current = "";
    speech.reset();
  };

  return (
    <div className="appShell">
      <AppNav />

      <div className="workBody">
        <div className="nameRow">
          {residents.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`nameChip ${activeId === r.id ? "active" : ""} ${r.priority === "urgent" ? "urgent" : ""} ${submittedIds.includes(r.id) ? "done" : ""}`}
              onClick={() => {
                setActiveId(r.id);
                const last = (recordedMap[r.id] ?? []).at(-1);
                setSpoken(last?.transcript ?? "");
              }}
            >
              {r.room} {r.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {spoken ? (
          <blockquote className="spoken">
            {recordingId ? <Waveform /> : null}
            <p>{spoken}</p>
          </blockquote>
        ) : null}

        <ChartPaper
          resident={resident}
          dateLabel={dateLabel}
          submitted={submitted}
          allowEdit={allDone && !submitted}
          highlightKeys={highlightKeys}
          onEdit={onEdit}
          onConfirm={onConfirm}
          onNotes={onNotes}
        />

        {!submitted && (
          <ul className="clipGrid">
            {clips.map((clip, index) => {
              const isRec = index < recorded.length;
              const isNext = index === nextIndex;
              const isOn = recordingId === clip.id;
              return (
                <li key={clip.id}>
                  <button
                    type="button"
                    className={`clipCell ${isRec ? "done" : ""} ${isNext ? "next" : ""} ${isOn ? "recording" : ""}`}
                    disabled={!isRec && (!isNext || busy)}
                    onClick={() => handleSlot(clip, index)}
                  >
                    <span className="clipTime">{clip.time}</span>
                    {isOn && <Waveform />}
                    {isRec && <span className="clipSummary">{clip.summary}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="dock">
        {speech.error && <p className="micError">{speech.error}</p>}
        {!submitted && (
          <MicButton
            recording={!!recordingId || speech.listening}
            disabled={busy || (!nextClip && !speech.listening)}
            onClick={handleRecord}
          />
        )}
        {allDone && !submitted && (
          <button type="button" className="btnPrimary" disabled={!canSubmit} onClick={handleSubmit}>
            提出
          </button>
        )}
        {allDone && !submitted && !canSubmit && (
          <p className="dockHint">要対応の「確認」を押すと提出できます</p>
        )}
        {submitted && (
          <>
            <a href="/records" className="btnPrimary dockLink">
              記録
            </a>
            <button type="button" className="btnSecondary" onClick={() => setSubmittedIds((ids) => ids.filter((id) => id !== resident.id))}>
              戻る
            </button>
            <button type="button" className="btnSecondary" onClick={resetAll}>
              はじめから
            </button>
          </>
        )}
      </div>
    </div>
  );
}
