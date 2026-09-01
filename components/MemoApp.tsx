"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { ChartPaper } from "@/components/ChartPaper";
import { MicButton, Waveform } from "@/components/MicButton";
import { Spinner } from "@/components/Spinner";
import { StaffShell } from "@/components/StaffShell";
import { SummaryCard } from "@/components/SummaryCard";
import { useDemoDate } from "@/hooks/useDemoDate";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  countReviewFields,
  getFirstReviewField,
  residentCanSubmit,
} from "@/lib/fieldUtils";
import { nowTime } from "@/lib/facility";
import {
  applyClip,
  combinedTranscript,
  createInitialResidents,
  getClips,
} from "@/lib/memoDay";
import { addHandoffRecord } from "@/lib/recordsStore";
import { printSheet } from "@/lib/print";
import type { MemoClip, RecordedClip, ResidentDraft } from "@/lib/types";

type RecordMap = Record<string, RecordedClip[]>;
type DockMode = "record" | "busy" | "confirm" | "submit" | "records";
type InputMode = "recording" | "typing" | null;

export function MemoApp() {
  const [residents, setResidents] = useState<ResidentDraft[]>(createInitialResidents);
  const [activeId, setActiveId] = useState("tanaka");
  const [recordedMap, setRecordedMap] = useState<RecordMap>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [spoken, setSpoken] = useState("");
  const [highlightKeys, setHighlightKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewFade, setViewFade] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);

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
  const reviewCount = countReviewFields(resident);
  const firstReview = getFirstReviewField(resident);
  const dateLabel = useDemoDate();
  const recording = inputMode === "recording" || !!recordingId || speech.listening;

  const dockMode: DockMode = submitted
    ? "records"
    : recording
      ? "record"
      : busy
        ? "busy"
        : allDone && reviewCount > 0
          ? "confirm"
          : allDone && canSubmit
            ? "submit"
            : "record";

  const statusText = (() => {
    if (submitted) return "提出済";
    if (recording) return "録音中";
    if (busy) return "清書中…";
    if (allDone && reviewCount > 0) return `要対応 ${reviewCount}`;
    if (allDone && canSubmit) return "提出できます";
    if (nextClip) return `次 ${nextClip.time}`;
    return "録音で申し送りを作る";
  })();

  const runClip = useCallback((clip: MemoClip) => {
    setInputMode("recording");
    setBusy(true);
    setRecordingId(clip.id);
    setSpoken("");

    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setSpoken(clip.transcript.slice(0, i));
      if (i >= clip.transcript.length) clearInterval(typeTimer);
    }, 42);

    const typeDelay = Math.max(clip.transcript.length * 42 + 280, clip.durationSec * 90 + 400);

    setTimeout(() => {
      clearInterval(typeTimer);
      setSpoken(clip.transcript);
      setRecordingId(null);

      setTimeout(() => {
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
        setBusy(false);
        setInputMode(null);
        setTimeout(() => setSpoken(""), 1400);
      }, 900);
    }, typeDelay);
  }, []);

  const runInputRoute = useCallback(() => {
    const remaining = clips.slice(nextIndex);
    if (!remaining.length || submitted || busy || recording) return;

    const text = combinedTranscript(clips, nextIndex);
    setInputMode("typing");
    setBusy(true);
    setSpoken("");

    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setSpoken(text.slice(0, i));
      if (i >= text.length) clearInterval(typeTimer);
    }, 38);

    const typeDelay = Math.max(text.length * 38 + 400, 1200);

    setTimeout(() => {
      clearInterval(typeTimer);
      setSpoken(text);

      setTimeout(() => {
        let clipIndex = 0;
        const applyNext = () => {
          const clip = remaining[clipIndex];
          if (!clip) {
            setBusy(false);
            setInputMode(null);
            setTimeout(() => setSpoken(""), 1200);
            return;
          }

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

          clipIndex += 1;
          setTimeout(applyNext, 520);
        };

        applyNext();
      }, 700);
    }, typeDelay);
  }, [busy, clips, nextIndex, recording, submitted]);

  const handleSlot = (clip: MemoClip, index: number) => {
    if (submitted || busy) return;
    if (index === nextIndex) runClip(clip);
  };

  const handleRecord = () => {
    if (inputMode === "typing") return;
    if (speech.listening) {
      speech.stop();
      return;
    }
    if (nextClip && !busy && !submitted) runClip(nextClip);
  };

  const handleInput = () => {
    if (inputMode === "recording" || recording || busy || submitted || !nextClip) return;
    runInputRoute();
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

  const confirmField = (doc: "handoff" | "progress", key: string) => {
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

  const onConfirmDock = () => {
    if (!firstReview) return;
    confirmField(firstReview.doc, firstReview.field.key);
  };

  const onNotes = (value: string) => {
    setResidents((prev) => prev.map((r) => (r.id === activeId ? { ...r, notes: value } : r)));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    addHandoffRecord(resident, dateLabel, nowTime());
    setViewFade(true);
    setTimeout(() => {
      setSubmittedIds((prev) => [...prev, resident.id]);
      setSpoken("");
      setViewFade(false);
    }, 220);
  };

  const resetAll = () => {
    setResidents(createInitialResidents());
    setRecordedMap({});
    setSpoken("");
    setSubmittedIds([]);
    setActiveId("tanaka");
    setInputMode(null);
    processedSpeechRef.current = "";
    speech.reset();
  };

  const nameRow = (
    <div className="nameRow">
      {residents.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`nameChip ${activeId === r.id ? "active" : ""} ${r.priority === "urgent" ? "urgent" : ""} ${submittedIds.includes(r.id) ? "done" : ""}`}
          onClick={() => {
            setActiveId(r.id);
            setSpoken("");
          }}
        >
          {r.room} {r.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );

  return (
    <>
    <StaffShell
      body={
      <div className={`workBody ${viewFade ? "viewFade" : ""}`}>
        {submitted ? (
          <div className="workMain workMainConfirm">
            {nameRow}
            <p className="statusLine statusLineDone">{statusText}</p>
            <SummaryCard resident={resident} dateLabel={dateLabel} submitted highlightKeys={highlightKeys} />
            <button type="button" className="textLink" onClick={() => setSheetOpen(true)}>
              カルテを見る
            </button>
            <button
              type="button"
              className="textLink textLinkMuted"
              onClick={() => setSubmittedIds((ids) => ids.filter((id) => id !== resident.id))}
            >
              戻る
            </button>
          </div>
        ) : (
          <div className="workMain">
            {nameRow}
            <p
              className={`statusLine ${recording ? "statusLineRec" : ""} ${reviewCount > 0 && allDone ? "statusLineWarn" : ""}`}
              title={statusText}
            >
              {statusText}
            </p>
            {spoken ? <p className="liveSpeech">{spoken}</p> : null}
            <SummaryCard resident={resident} dateLabel={dateLabel} highlightKeys={highlightKeys} />
            <div className="workActions">
              {!resident.notes && (
                <button type="button" className="textLink" onClick={() => setSheetOpen(true)}>
                  備考
                </button>
              )}
              {resident.notes ? (
                <button type="button" className="textLink" onClick={() => setSheetOpen(true)}>
                  カルテを見る
                </button>
              ) : null}
            </div>
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
                      {isRec && <span className="clipSummary">{clip.summary}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    }
    dock={
      <div className="dock dockSingle">
        {speech.error && <p className="micError">{speech.error}</p>}

        {dockMode === "record" && (
          <div className="dockDual">
            <div>
              {recording && <Waveform />}
              <MicButton
                recording={recording}
                disabled={busy || !nextClip || inputMode === "typing"}
                onClick={handleRecord}
              />
            </div>
            <button
              type="button"
              className="btnSecondary"
              disabled={busy || !nextClip || inputMode === "recording"}
              onClick={handleInput}
            >
              入力
            </button>
          </div>
        )}

        {dockMode === "busy" && (
          <button type="button" className="btnPrimary btnBusy" disabled>
            <Spinner />
            清書中…
          </button>
        )}

        {dockMode === "confirm" && (
          <button type="button" className="btnPrimary btnConfirm" onClick={onConfirmDock}>
            確認
          </button>
        )}

        {dockMode === "submit" && (
          <button type="button" className="btnPrimary" onClick={handleSubmit}>
            提出
          </button>
        )}

        {dockMode === "records" && (
          <div className="dockTriple">
            <button type="button" className="btnSecondary" onClick={() => printSheet("memo")}>
              印刷
            </button>
            <a href="/nippo" className="btnPrimary dockLink">
              日報
            </a>
            <button type="button" className="btnSecondary dockTripleFull" onClick={resetAll}>
              はじめから
            </button>
          </div>
        )}
      </div>
      }
      extra={
      <BottomSheet open={sheetOpen} title="申し送りカルテ" onClose={() => setSheetOpen(false)}>
        <ChartPaper
          resident={resident}
          dateLabel={dateLabel}
          submitted={submitted}
          allowEdit={allDone && !submitted}
          highlightKeys={highlightKeys}
          onEdit={onEdit}
          onConfirm={confirmField}
          onNotes={onNotes}
        />
      </BottomSheet>
      }
    />
    {submitted ? (
      <div className="printSheet printSheetMemo" aria-hidden>
        <ChartPaper
          resident={resident}
          dateLabel={dateLabel}
          submitted
          highlightKeys={highlightKeys}
        />
      </div>
    ) : null}
    </>
  );
}
