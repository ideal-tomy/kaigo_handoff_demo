"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { BottomSheet } from "@/components/BottomSheet";
import { ChartPaper } from "@/components/ChartPaper";
import { MicButton, Waveform } from "@/components/MicButton";
import { Spinner } from "@/components/Spinner";
import { SummaryCard } from "@/components/SummaryCard";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  countReviewFields,
  getFirstReviewField,
  residentCanSubmit,
} from "@/lib/fieldUtils";
import { todayLabel, nowTime } from "@/lib/facility";
import {
  applyClip,
  createInitialResidents,
  getClips,
  getFieldLabel,
} from "@/lib/memoDay";
import { addHandoffRecord } from "@/lib/recordsStore";
import type { MemoClip, RecordedClip, ResidentDraft } from "@/lib/types";

type RecordMap = Record<string, RecordedClip[]>;
type DockMode = "record" | "busy" | "confirm" | "submit" | "records";

export function MemoApp() {
  const [residents, setResidents] = useState<ResidentDraft[]>(createInitialResidents);
  const [activeId, setActiveId] = useState("tanaka");
  const [recordedMap, setRecordedMap] = useState<RecordMap>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [spoken, setSpoken] = useState("");
  const [writingLabel, setWritingLabel] = useState("");
  const [highlightKeys, setHighlightKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewFade, setViewFade] = useState(false);

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
  const dateLabel = todayLabel();
  const recording = !!recordingId || speech.listening;

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
    if (recording) return spoken ? spoken : "録音中";
    if (busy && writingLabel) return `${writingLabel}を書き込み中…`;
    if (busy) return "書き込み中…";
    if (allDone && reviewCount > 0) return `要対応 ${reviewCount}`;
    if (allDone && canSubmit) return "提出できます";
    if (nextClip) return `次 ${nextClip.time}`;
    return "録音で申し送りを作る";
  })();

  const runClip = useCallback((clip: MemoClip) => {
    setBusy(true);
    setRecordingId(clip.id);
    setSpoken("");
    setWritingLabel("");

    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setSpoken(clip.transcript.slice(0, i));
      if (i >= clip.transcript.length) clearInterval(typeTimer);
    }, 28);

    const writeDelay = Math.max(clip.transcript.length * 28 + 200, clip.durationSec * 80 + 400);

    setTimeout(() => {
      clearInterval(typeTimer);
      setSpoken(clip.transcript);
      setRecordingId(null);

      const lastPatch = clip.patches.at(-1);
      if (lastPatch) {
        setWritingLabel(getFieldLabel(clip.residentId, lastPatch.doc, lastPatch.fieldKey));
      }

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
        setWritingLabel("");
        setBusy(false);
      }, 450);
    }, writeDelay);
  }, []);

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
            const last = (recordedMap[r.id] ?? []).at(-1);
            setSpoken(last?.transcript ?? "");
          }}
        >
          {r.room} {r.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="appShell">
      <AppNav />

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

      <div className="dock dockSingle">
        {speech.error && <p className="micError">{speech.error}</p>}

        {dockMode === "record" && (
          <>
            {recording && <Waveform />}
            <MicButton
              recording={recording}
              disabled={busy || !nextClip}
              onClick={handleRecord}
            />
          </>
        )}

        {dockMode === "busy" && (
          <button type="button" className="btnPrimary btnBusy" disabled>
            <Spinner />
            書き込み中…
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
          <>
            <a href="/records" className="btnPrimary dockLink">
              記録
            </a>
            <button type="button" className="btnSecondary" onClick={resetAll}>
              はじめから
            </button>
          </>
        )}
      </div>

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
    </div>
  );
}
