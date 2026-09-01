"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { RecHud } from "@/components/RecHud";
import { Spinner } from "@/components/Spinner";
import { useDemoDate } from "@/hooks/useDemoDate";
import { SHIFT_TO, UNIT } from "@/lib/facility";
import { buildFloor, statusLabel } from "@/lib/nippo";
import { setOverlayRow } from "@/lib/nippoOverlay";
import { NIPPO_VOICE_BEATS, nippoVoiceScript } from "@/lib/nippoVoice";
import { printSheet } from "@/lib/print";
import {
  confirmRecord,
  ensureSeed,
  listPending,
  listRecords,
  takeFocus,
  type SubmittedRecord,
} from "@/lib/recordsStore";
import type { ConversationLine } from "@/lib/types";

const CHAR_MS = 72;
const END_MS = 640;
const START_MS = 200;

function RecordPreview({ row }: { row: SubmittedRecord }) {
  const stamp = row.status === "confirmed" ? "確認済" : row.kind === "karte" ? "記録済" : "提出済";
  const fields = row.kind === "karte" ? (row.extraFields ?? []) : row.progress;

  return (
    <article className={`chartPaper ${row.status === "confirmed" ? "submitted" : ""}`}>
      <header className="paperHead">
        <div className="paperHeadTop">
          <p className="paperDocName">{row.kind === "karte" ? "経過記録" : "申し送り"}</p>
          <span className="paperStamp">{stamp}</span>
        </div>
        <p className="paperMeta">
          {UNIT}　{row.dateLabel}　{SHIFT_TO}　{row.submittedAt}　{row.author}
        </p>
        <div className="paperWho">
          <h2>
            {row.room}　{row.name}　様
          </h2>
        </div>
      </header>
      {row.kind === "karte" ? (
        <>
          {row.quote ? (
            <section className="paperSection">
              <h3>本人の言葉</h3>
              <blockquote className="quoteText hero">{row.quote}</blockquote>
            </section>
          ) : null}
          {row.assessment ? (
            <section className="paperSection">
              <h3>アセスメント</h3>
              <p className="paperVal">{row.assessment}</p>
            </section>
          ) : null}
        </>
      ) : null}
      <section className="paperSection">
        <h3>{row.kind === "karte" ? "記録" : "経過記録"}</h3>
        <div className="paperRows">
          {fields.map((f) => (
            <div
              key={f.key}
              className={`paperRow ${f.priority === "urgent" ? "urgent" : ""} ${f.priority === "attention" ? "attention" : ""}`}
            >
              <div className="paperKey">{f.label}</div>
              <div className="paperVal">{f.value || "—"}</div>
            </div>
          ))}
        </div>
      </section>
      {row.kind === "handoff" ? (
        <section className="paperSection">
          <h3>申し送り</h3>
          <div className="paperRows">
            {row.handoff.map((f) => (
              <div
                key={f.key}
                className={`paperRow ${f.priority === "urgent" ? "urgent" : ""} ${f.priority === "attention" ? "attention" : ""}`}
              >
                <div className="paperKey">{f.label}</div>
                <div className="paperVal">{f.value || "—"}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function FloorCards({
  floor,
  flashResident,
}: {
  floor: ReturnType<typeof buildFloor>;
  flashResident: string | null;
}) {
  return (
    <div className="nippoCards">
      {floor.map((row) => (
        <article
          key={row.id}
          className={`nippoCard ${row.priority === "urgent" ? "urgent" : ""} ${row.priority === "attention" ? "attention" : ""} ${flashResident === row.id ? "flash" : ""}`}
        >
          <div className="nippoCardHead">
            <span className="nippoCardWho">{row.name.split(" ")[0]}</span>
            <span className="nippoCardRoom">{row.room}</span>
          </div>
          <div className="nippoCardRow">
            <span className="nippoCardKey">経過</span>
            <span className="nippoCardVal">{row.progressText}</span>
          </div>
          <div className="nippoCardRow">
            <span className="nippoCardKey">申送</span>
            <span className="nippoCardVal">
              {row.handoff === "confirmed" ? row.handoffText : statusLabel(row.handoff, "handoff")}
            </span>
          </div>
          <div className="nippoCardRow">
            <span className="nippoCardKey">注意</span>
            <span className="nippoCardVal">{row.notice}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function NippoBoard() {
  const [rows, setRows] = useState<SubmittedRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flashItem, setFlashItem] = useState<string | null>(null);
  const [flashResident, setFlashResident] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [writing, setWriting] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [log, setLog] = useState<ConversationLine[]>([]);
  const [draft, setDraft] = useState<ConversationLine | null>(null);
  const [overlayTick, setOverlayTick] = useState(0);
  const cancelRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const refresh = useCallback(() => setRows(listRecords()), []);

  useEffect(() => {
    ensureSeed();
    refresh();
    const onOverlay = () => setOverlayTick((n) => n + 1);
    window.addEventListener("kaigo-records", refresh);
    window.addEventListener("kaigo-nippo-overlay", onOverlay);
    return () => {
      window.removeEventListener("kaigo-records", refresh);
      window.removeEventListener("kaigo-nippo-overlay", onOverlay);
    };
  }, [refresh]);

  useEffect(() => {
    if (rows.length === 0) return;
    const focused = takeFocus();
    const waiting = rows.filter((r) => r.status !== "confirmed");
    if (focused && rows.some((r) => r.id === focused)) {
      setSelectedId(focused);
      setFlashItem(focused);
      const t = window.setTimeout(() => setFlashItem(null), 1600);
      return () => window.clearTimeout(t);
    }
    setSelectedId((current) => {
      if (current && rows.some((r) => r.id === current)) return current;
      return waiting[0]?.id ?? rows[0]?.id ?? null;
    });
  }, [rows]);

  const pending = useMemo(() => rows.filter((r) => r.status !== "confirmed"), [rows]);
  const pendingResidents = useMemo(() => new Set(pending.map((r) => r.residentId)), [pending]);
  const floor = useMemo(() => buildFloor(rows), [rows, overlayTick]);
  const selected = rows.find((r) => r.id === selectedId) ?? pending[0] ?? null;
  const canConfirm = selected?.status === "submitted" && !recording && !writing;
  const canPrint = pending.length === 0 && rows.some((r) => r.status === "confirmed") && !recording && !writing;
  const dateLabel = useDemoDate();

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
    const id = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const canVoiceFill = useCallback(
    (residentId: string) => {
      if (pendingResidents.has(residentId)) return false;
      const row = floor.find((r) => r.id === residentId);
      return row ? row.handoff !== "confirmed" : false;
    },
    [floor, pendingResidents]
  );

  const applyBeat = (beatIndex: number) => {
    const beat = NIPPO_VOICE_BEATS[beatIndex];
    if (!beat || !canVoiceFill(beat.residentId)) return;
    setOverlayRow(beat.residentId, beat.fill);
    setFlashResident(beat.residentId);
    later(() => setFlashResident(null), 900);
  };

  const finishVoice = (fromBeat: number) => {
    setRecording(false);
    setDraft(null);
    const remaining = NIPPO_VOICE_BEATS.length - fromBeat;
    if (remaining <= 0) {
      setWriting(false);
      return;
    }
    setWriting(true);
    for (let i = fromBeat; i < NIPPO_VOICE_BEATS.length; i += 1) {
      later(() => applyBeat(i), (i - fromBeat) * 520);
    }
    later(() => setWriting(false), remaining * 520 + 400);
  };

  const startVoice = () => {
    if (recording || writing) return;
    cancelRef.current = false;
    clearTimers();
    setRecording(true);
    setWriting(false);
    setLog([]);
    setDraft(null);

    const lines = nippoVoiceScript();

    const playLine = (index: number, acc: ConversationLine[]) => {
      if (cancelRef.current) return;
      if (index >= lines.length) {
        setRecording(false);
        setDraft(null);
        later(() => setWriting(false), 400);
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
          applyBeat(index);
          later(() => playLine(index + 1, next), END_MS);
        } else {
          later(tick, CHAR_MS);
        }
      };
      later(tick, index === 0 ? 360 : START_MS);
    };

    playLine(0, []);
  };

  const stopVoice = () => {
    if (!recording) return;
    clearTimers();
    cancelRef.current = true;
    const played = log.length;
    finishVoice(played);
  };

  const onConfirm = () => {
    if (!selected || selected.status !== "submitted") return;
    const residentId = selected.residentId;
    confirmRecord(selected.id);
    setFlashResident(residentId);
    window.setTimeout(() => {
      const nextPending = listPending();
      setSelectedId(nextPending[0]?.id ?? selected.id);
      setFlashResident(null);
    }, 900);
  };

  return (
    <>
    <div className="appShell nippoShell">
      <AppNav />
      <div className="nippoBody">
        <div className={`nippoLayout ${pending.length === 0 ? "nippoLayoutSolo" : ""}`}>
          <aside className="nippoQueue">
            {pending.length > 0 ? (
              <p className="nippoQueueHead">{pending.length}</p>
            ) : null}
            <ul className="nippoQueueList">
              {pending.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`nippoQueueItem ${selectedId === row.id ? "active" : ""} ${flashItem === row.id ? "flash" : ""}`}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <span className="nippoQueueWho">
                      {row.room} {row.name.split(" ")[0]}
                    </span>
                    <span className="nippoQueueMeta">
                      {row.kind === "karte" ? "経過記録" : "申し送り"}　{row.submittedAt}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {selected ? (
              <div className="nippoPreview">
                <div className="nippoPreviewBar">
                  <button type="button" className="btnSecondary" onClick={() => printSheet("record")}>
                    印刷
                  </button>
                </div>
                <RecordPreview row={selected} />
              </div>
            ) : (
              <p className="emptyHint">—</p>
            )}
          </aside>

          <section className="nippoPaperWrap">
            <article className={`chartPaper nippoPaper ${canPrint ? "submitted" : ""}`}>
              <header className="paperHead">
                <div className="paperHeadTop">
                  <p className="paperDocName">日報</p>
                  {canPrint ? <span className="paperStamp">確認済</span> : null}
                </div>
                <p className="paperMeta">
                  {UNIT}　{dateLabel}　{SHIFT_TO}
                </p>
              </header>
              <div className="nippoTableWrap">
                <table className="nippoTable">
                  <thead>
                    <tr>
                      <th>室</th>
                      <th>氏名</th>
                      <th>申し送り</th>
                      <th>面談</th>
                      <th>経過</th>
                      <th>注意</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floor.map((row) => (
                      <tr
                        key={row.id}
                        className={`${row.priority === "urgent" ? "urgent" : ""} ${row.priority === "attention" ? "attention" : ""} ${flashResident === row.id ? "flash" : ""}`}
                      >
                        <td>{row.room}</td>
                        <td>{row.name.split(" ")[0]}</td>
                        <td>
                          {row.handoff === "confirmed"
                            ? row.handoffText || "確認済"
                            : statusLabel(row.handoff, "handoff")}
                        </td>
                        <td>{statusLabel(row.karte, "karte")}</td>
                        <td>{row.progressText}</td>
                        <td>{row.notice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <FloorCards floor={floor} flashResident={flashResident} />
            </article>
          </section>
        </div>
      </div>

      {recording ? (
        <div className="nippoRecOverlay">
          <RecHud
            seconds={recSeconds}
            draft={draft}
            lines={log}
            residentName="フロア一巡"
            onStop={stopVoice}
          />
        </div>
      ) : null}

      <div className="nippoDock">
        {writing ? (
          <button type="button" className="btnPrimary btnBusy" disabled>
            <Spinner />
            清書中…
          </button>
        ) : canConfirm ? (
          <div className="nippoDockRow">
            <button type="button" className="btnPrimary btnConfirm" onClick={onConfirm}>
              確認
            </button>
            <button type="button" className="btnSecondary" onClick={startVoice}>
              録音
            </button>
          </div>
        ) : canPrint ? (
          <div className="nippoDockRow">
            <button type="button" className="btnSecondary" onClick={startVoice}>
              録音
            </button>
            <button type="button" className="btnPrimary" onClick={() => printSheet("nippo")}>
              印刷
            </button>
          </div>
        ) : (
          <button type="button" className="btnSecondary" onClick={startVoice}>
            録音
          </button>
        )}
      </div>
    </div>
    {selected ? (
      <div className="printSheet printSheetRecord" aria-hidden>
        <RecordPreview row={selected} />
      </div>
    ) : null}
    </>
  );
}
