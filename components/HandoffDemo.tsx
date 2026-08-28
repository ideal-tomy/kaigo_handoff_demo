"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProcessStepper } from "@/components/ProcessStepper";
import { SampleLauncher } from "@/components/SampleLauncher";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { allReviewFieldsFixed, fieldNeedsFix, parseTranscriptToDrafts } from "@/lib/parseTranscript";
import { cloneFields, getSampleById } from "@/lib/samples";
import type {
  DocumentTab,
  DraftStatus,
  HandoffDraft,
  InboxItem,
  ProgressNote,
  TemplateField,
} from "@/lib/types";
import { DEMO_CONTEXT } from "@/lib/types";

type Step = 1 | 2 | 3 | 4;

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

export function HandoffDemo() {
  const [view, setView] = useState<"demo" | "inbox">("demo");
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [handoff, setHandoff] = useState<HandoffDraft | null>(null);
  const [progress, setProgress] = useState<ProgressNote | null>(null);
  const [visibleFieldCount, setVisibleFieldCount] = useState(0);
  const [docTab, setDocTab] = useState<DocumentTab>("handoff");
  const [textInput, setTextInput] = useState("");
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const speech = useSpeechRecognition();
  const processedSpeechRef = useRef("");

  const resetDemo = useCallback(() => {
    setStep(1);
    setStatus("idle");
    setTranscript("");
    setDisplayTranscript("");
    setHandoff(null);
    setProgress(null);
    setVisibleFieldCount(0);
    setDocTab("handoff");
    setTextInput("");
    setScenarioId(null);
    setBusy(false);
    processedSpeechRef.current = "";
    speech.reset();
    if (speech.listening) speech.stop();
  }, [speech]);

  const typeTranscript = useCallback((full: string, onDone: () => void) => {
    setDisplayTranscript("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < full.length) {
        setDisplayTranscript(full.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 35);
  }, []);

  const revealFields = useCallback((handoffFields: TemplateField[], progressFields: TemplateField[]) => {
    const total = handoffFields.length + progressFields.length;
    setVisibleFieldCount(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleFieldCount(count);
      if (count >= total) clearInterval(interval);
    }, 160);
  }, []);

  const applyDrafts = useCallback(
    (h: HandoffDraft, p: ProgressNote, fullTranscript: string, sid?: string) => {
      setTranscript(fullTranscript);
      setHandoff(h);
      setProgress(p);
      if (sid) setScenarioId(sid);
      setStep(2);
      setStatus("transcribing");
      typeTranscript(fullTranscript, () => {
        setStep(3);
        setStatus("drafting");
        revealFields(h.fields, p.fields);
        setTimeout(() => {
          setStatus("review");
        }, h.fields.length * 160 + 200);
      });
    },
    [revealFields, typeTranscript]
  );

  const runSample = useCallback(
    (sampleId: string) => {
      const sample = getSampleById(sampleId);
      if (!sample || busy) return;

      resetDemo();
      setBusy(true);
      setStep(1);
      setStatus("recording");

      setTimeout(() => {
        applyDrafts(
          { ...sample.handoff, fields: cloneFields(sample.handoff.fields) },
          { ...sample.progress, fields: cloneFields(sample.progress.fields) },
          sample.transcript,
          sample.id
        );
        setBusy(false);
      }, sample.audioDurationSec * 100 * 0.5 + 800);
    },
    [applyDrafts, busy, resetDemo]
  );

  const runFromText = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return;
      resetDemo();
      setBusy(true);

      let h: HandoffDraft;
      let p: ProgressNote;
      let sid: string | undefined;

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            handoff: HandoffDraft;
            progress: ProgressNote;
            scenarioId?: string;
          };
          h = data.handoff;
          p = data.progress;
          sid = data.scenarioId;
        } else {
          throw new Error("api unavailable");
        }
      } catch {
        const parsed = parseTranscriptToDrafts(text);
        h = parsed.handoff;
        p = parsed.progress;
        sid = parsed.matchedScenarioId;
      }

      applyDrafts(h, p, text, sid);
      setBusy(false);
    },
    [applyDrafts, busy, resetDemo]
  );

  useEffect(() => {
    const text = speech.transcript.trim();
    if (!text || speech.listening || busy) return;
    if (processedSpeechRef.current === text) return;
    processedSpeechRef.current = text;
    void runFromText(text);
  }, [speech.listening, speech.transcript, runFromText, busy]);

  const updateField = (
    doc: DocumentTab,
    key: string,
    value: string
  ) => {
    if (doc === "handoff" && handoff) {
      setHandoff({
        ...handoff,
        fields: handoff.fields.map((f) => (f.key === key ? { ...f, value } : f)),
      });
    }
    if (doc === "progress" && progress) {
      setProgress({
        ...progress,
        fields: progress.fields.map((f) => (f.key === key ? { ...f, value } : f)),
      });
    }
  };

  const canSubmit =
    handoff &&
    progress &&
    status === "review" &&
    allReviewFieldsFixed(handoff.fields, progress.fields);

  const isSubmitted = status === "submitted";

  const handleSubmit = () => {
    if (!handoff || !progress || !canSubmit) return;
    setStatus("submitted");
    setStep(4);

    const summary =
      handoff.fields.find((f) => f.key === "nextAction")?.value ??
      handoff.fields[0]?.value ??
      "申し送り";

    const item: InboxItem = {
      id: `inbox-${Date.now()}`,
      scenarioId: (scenarioId as InboxItem["scenarioId"]) ?? "normal",
      resident: handoff.resident,
      summary,
      priority: handoff.priority,
      submittedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      handoff: { ...handoff, submittedAt: new Date().toISOString() },
      progress,
    };

    setInbox((prev) => [item, ...prev]);
    setTimeout(() => setView("inbox"), 600);
  };

  const currentFields =
    docTab === "handoff" ? handoff?.fields ?? [] : progress?.fields ?? [];
  const handoffFieldCount = handoff?.fields.length ?? 0;

  const getFieldVisibleIndex = (index: number) => {
    if (docTab === "handoff") return index;
    return handoffFieldCount + index;
  };

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="appHeaderLabel">Care Facility System</div>
        <h1 className="appHeaderTitle">申し送りAI</h1>
        <p className="appHeaderSub">音声メモから申し送り票・経過記録を自動整理</p>
      </header>

      <div className="contextBar">
        <span>
          ユニット: <strong>{DEMO_CONTEXT.unit}</strong>
        </span>
        <span>
          シフト: <strong>{DEMO_CONTEXT.shiftFrom}</strong> → {DEMO_CONTEXT.shiftTo}
        </span>
        <span>
          記録者: <strong>{DEMO_CONTEXT.recorder}</strong>
        </span>
      </div>

      <div className="beforeAfter">
        <span>手書き申し送り 約8分</span>
        <span>→</span>
        <span>確認・提出 約45秒</span>
      </div>

      {view === "inbox" ? (
        <div className="inboxPanel">
          <h2 className="inboxTitle">日勤 受信一覧</h2>
          <p className="inboxSub">要対応の申し送りを優先表示しています</p>
          <div className="inboxList">
            {inbox.map((item) => (
              <div
                key={item.id}
                className={`inboxItem ${item.priority === "urgent" ? "urgent" : item.priority === "attention" ? "attention" : ""}`}
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
          <button
            type="button"
            className="btnSecondary"
            style={{ maxWidth: 320, marginTop: 20 }}
            onClick={() => {
              resetDemo();
              setView("demo");
            }}
          >
            新しい申し送りを記録する
          </button>
          <button
            type="button"
            className="btnSecondary"
            style={{ maxWidth: 320 }}
            onClick={() => {
              resetDemo();
              setView("demo");
            }}
          >
            入力画面に戻る
          </button>
        </div>
      ) : (
        <div className="mainGrid">
          <section className="panel">
            <div className="panelTitle">入力</div>
            <ProcessStepper step={step} />

            <SampleLauncher disabled={busy} onSelect={runSample} />

            {status === "recording" && (
              <>
                <div className="waveform" aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="waveBar" />
                  ))}
                </div>
                <p className="loadingText">サンプル音声を再生中…</p>
              </>
            )}

            <div className="inputDivider">または</div>

            <div className="liveInputSection">
              <textarea
                className="textArea"
                placeholder="音声メモの内容を貼り付け（任意）"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="btnPrimary"
                disabled={busy || !textInput.trim()}
                onClick={() => void runFromText(textInput)}
              >
                テキストからテンプレ化
              </button>

              <div className="micControls">
                <button
                  type="button"
                  className={`micBtn ${speech.listening ? "recording" : ""}`}
                  disabled={busy}
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                >
                  <MicIcon />
                  {speech.listening ? "録音停止" : "マイクで入力"}
                </button>
              </div>
              <p className="micHint">Chrome 推奨。失敗時はサンプルをご利用ください。</p>
              {speech.error && <p className="micError">{speech.error}</p>}
              {speech.listening && (
                <div className="waveform" aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="waveBar" />
                  ))}
                </div>
              )}
            </div>

            {(step > 1 || displayTranscript) && (
              <>
                <div className="inputDivider">書き起こし</div>
                <div className="transcriptBox">
                  {displayTranscript || (
                    <span className="transcriptEmpty">書き起こし結果がここに表示されます</span>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="panel">
            <div className="panelTitle">下書き</div>

            <div className="statusBar">
              <span className={`statusChip ${status === "review" ? "active" : ""} ${status === "submitted" ? "submitted" : ""}`}>
                {status === "idle" && "待機中"}
                {status === "recording" && "入力中"}
                {status === "transcribing" && "書き起こし中"}
                {status === "drafting" && "テンプレ化中"}
                {status === "review" && "確認待ち"}
                {status === "submitted" && "提出済"}
              </span>
              {handoff && (
                <span className={`priorityBadge ${handoff.priority}`}>
                  {handoff.priority === "urgent" ? "要対応" : handoff.priority === "attention" ? "確認" : "通常"}
                </span>
              )}
            </div>

            {handoff ? (
              <>
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

                <p style={{ fontSize: 13, marginBottom: 12, color: "var(--text-secondary)" }}>
                  {docTab === "handoff" ? handoff.resident : progress?.resident}
                </p>

                <div className="templateFields">
                  {currentFields.map((field, index) => {
                    const visibleIndex = getFieldVisibleIndex(index);
                    const visible = visibleFieldCount > visibleIndex;
                    const needsFix = fieldNeedsFix(field);
                    return (
                      <div
                        key={field.key}
                        className={`templateField ${visible ? "visible" : ""} ${needsFix ? "review" : ""} ${field.priority === "urgent" ? "urgent" : ""}`}
                      >
                        <div className="fieldLabel">
                          {field.label}
                          {field.priority === "urgent" && (
                            <span className="priorityBadge urgent">要対応</span>
                          )}
                          {field.priority === "attention" && (
                            <span className="priorityBadge attention">確認</span>
                          )}
                          {needsFix && (
                            <span className="priorityBadge attention">要修正</span>
                          )}
                        </div>
                        {status === "review" || isSubmitted ? (
                          <input
                            className="fieldInput"
                            value={field.value}
                            onChange={(e) => updateField(docTab, field.key, e.target.value)}
                            disabled={isSubmitted}
                            aria-label={field.label}
                          />
                        ) : (
                          <div className="fieldValue">{field.value}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {status === "review" && !canSubmit && (
                  <p className="micError" style={{ marginTop: 12 }}>
                    黄色の要修正欄を正しい内容に直してください
                  </p>
                )}

                <button
                  type="button"
                  className="btnPrimary"
                  style={{ marginTop: 16 }}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  確認して申し送りする
                </button>
              </>
            ) : (
              <p className="transcriptEmpty">
                サンプルを選ぶか、テキスト／マイクで入力すると下書きが表示されます
              </p>
            )}

            <button type="button" className="btnSecondary" onClick={resetDemo} disabled={busy}>
              やり直す
            </button>
          </section>
        </div>
      )}

      <footer className="appFooter">
        <span>DEMO VERSION</span>
        <span className="footerDot" aria-hidden />
        <span>介護施設向け</span>
      </footer>
    </div>
  );
}
