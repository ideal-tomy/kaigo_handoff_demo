import { memo, type ReactNode } from "react";
import { KarteSummaryCard } from "@/components/KarteSummaryCard";
import { MicButton, Waveform } from "@/components/MicButton";
import { RecHud } from "@/components/RecHud";
import { SummaryCard } from "@/components/SummaryCard";
import { todayLabel, UNIT, SHIFT_TO } from "@/lib/facility";
import { KARTE_RESIDENTS } from "@/lib/karteSessions";
import type { ResidentDraft } from "@/lib/types";
import type { DeviceId } from "./story";

const DATE_LABEL = todayLabel();
const KARTE = KARTE_RESIDENTS[0];
const KARTE_LINES = KARTE.session.lines.slice(0, 3);
const KARTE_DRAFT = KARTE.session.lines[1];
const KARTE_FIELDS = KARTE.session.progress.fields.filter((field) =>
  ["complaint", "pain", "medication", "risk"].includes(field.key)
);

const recordingResident: ResidentDraft = {
  id: "tanaka",
  name: "田中 春子",
  room: "203",
  notes: "",
  priority: "normal",
  progress: [
    { key: "vitals", label: "バイタル", value: "朝 36.8℃" },
    { key: "appetite", label: "食欲", value: "普通" },
  ],
  handoff: [],
};

const reviewResident: ResidentDraft = {
  id: "tanaka",
  name: "田中 春子",
  room: "203",
  notes: "",
  priority: "urgent",
  progress: [
    { key: "vitals", label: "バイタル", value: "朝 36.8℃ → 夕 37.4℃", priority: "attention" },
    { key: "meal", label: "食事", value: "主食 1/2量" },
  ],
  handoff: [
    {
      key: "medication",
      label: "投薬",
      value: "解熱剤 投与済み",
      needsReview: true,
      correctValue: "解熱剤 未投与",
      priority: "urgent",
    },
    { key: "nextAction", label: "次担当", value: "投薬記録を確認。再発熱時は看護へ連絡" },
  ],
};

function phoneClass(id: DeviceId, stars: readonly DeviceId[]) {
  return `ki-device ki-phone ki-${id}${stars.includes(id) ? " ki-active" : " ki-idle"}`;
}

function Phone({
  id,
  tab,
  stars,
  children,
}: {
  id: DeviceId;
  tab: string;
  stars: readonly DeviceId[];
  children: ReactNode;
}) {
  return (
    <div className={phoneClass(id, stars)}>
      <div className="ki-island" />
      <div className="ki-device-bar">
        職員 <span>{tab}</span>
      </div>
      <div className="ki-phone-body">{children}</div>
    </div>
  );
}

function MiniNav({ active }: { active: DeviceId }) {
  return (
    <div className="kh-mini-nav" aria-hidden="true">
      <span className={active === "memo" ? "is-on" : ""}>申し送り</span>
      <span className={active === "karte" ? "is-on" : ""}>面談記録</span>
      <span className={active === "nippo" ? "is-on" : ""}>日報</span>
    </div>
  );
}

function ClipGrid({ recording }: { recording: boolean }) {
  return (
    <ul className="clipGrid">
      <li>
        <button type="button" className={`clipCell done ${recording ? "recording" : ""}`} disabled>
          <span className="clipTime">10:00</span>
          <span className="clipSummary">{recording ? "録音中" : "36.8℃"}</span>
        </button>
      </li>
      <li>
        <button type="button" className={`clipCell ${recording ? "" : "done"}`} disabled>
          <span className="clipTime">12:30</span>
          {recording ? null : <span className="clipSummary">主食 1/2量</span>}
        </button>
      </li>
      <li>
        <button type="button" className={`clipCell ${recording ? "" : "done"}`} disabled>
          <span className="clipTime">16:45</span>
          {recording ? null : <span className="clipSummary">37.4℃</span>}
        </button>
      </li>
    </ul>
  );
}

function MemoScreen({ recording }: { recording: boolean }) {
  return (
    <div className="kh-scale">
      <MiniNav active="memo" />
      <div className="workMain">
        <div className="nameRow">
          <button type="button" className={`nameChip active ${recording ? "" : "urgent"}`}>
            203 田中
          </button>
          <button type="button" className="nameChip">
            105 山田
          </button>
          <button type="button" className="nameChip">
            208 鈴木
          </button>
        </div>
        <p className={`statusLine ${recording ? "statusLineRec" : "statusLineWarn"}`}>
          {recording ? "録音中" : "要対応 1"}
        </p>
        {recording ? (
          <p className="liveSpeech">えーっと、田中さん、今朝は36.8でした。食欲はまあまあかな。</p>
        ) : null}
        <SummaryCard
          resident={recording ? recordingResident : reviewResident}
          dateLabel={DATE_LABEL}
        />
        <ClipGrid recording={recording} />
      </div>
      <div className="dock dockSingle">
        {recording ? (
          <div className="dockDual">
            <div>
              <Waveform />
              <MicButton recording disabled={false} onClick={() => undefined} />
            </div>
            <button type="button" className="btnSecondary" disabled>
              入力
            </button>
          </div>
        ) : (
          <button type="button" className="btnPrimary btnConfirm">
            確認
          </button>
        )}
      </div>
    </div>
  );
}

function KarteScreen({ recording }: { recording: boolean }) {
  return (
    <div className="kh-scale">
      <MiniNav active="karte" />
      {recording ? (
        <RecHud
          seconds={18}
          draft={KARTE_DRAFT}
          lines={KARTE_LINES}
          residentName={KARTE.name}
          onStop={() => undefined}
        />
      ) : (
        <div className="workMain">
          <KarteSummaryCard
            room={KARTE.room}
            name={KARTE.name}
            dateLabel={DATE_LABEL}
            quote={KARTE.session.progress.quote}
            assessment={KARTE.session.progress.assessment}
            fields={KARTE_FIELDS}
            notes=""
            submitted
          />
        </div>
      )}
    </div>
  );
}

function NippoCard({
  name,
  room,
  progress,
  handoff,
  notice,
  urgent,
}: {
  name: string;
  room: string;
  progress: string;
  handoff: string;
  notice: string;
  urgent?: boolean;
}) {
  return (
    <article className={`nippoCard ${urgent ? "urgent" : ""}`}>
      <div className="nippoCardHead">
        <span className="nippoCardWho">{name}</span>
        <span className="nippoCardRoom">{room}</span>
      </div>
      <div className="nippoCardRow">
        <span className="nippoCardKey">経過</span>
        <span className="nippoCardVal">{progress}</span>
      </div>
      <div className="nippoCardRow">
        <span className="nippoCardKey">申送</span>
        <span className="nippoCardVal">{handoff}</span>
      </div>
      <div className="nippoCardRow">
        <span className="nippoCardKey">注意</span>
        <span className="nippoCardVal">{notice}</span>
      </div>
    </article>
  );
}

function NippoScreen({ confirmed }: { confirmed: boolean }) {
  return (
    <div className="kh-scale kh-nippo-scale">
      <MiniNav active="nippo" />
      <article className={`chartPaper nippoPaper ${confirmed ? "submitted" : ""}`}>
        <header className="paperHead">
          <div className="paperHeadTop">
            <p className="paperDocName">日報</p>
            {confirmed ? <span className="paperStamp">確認済</span> : <span className="priorityBadge urgent">確認待ち 1</span>}
          </div>
          <p className="paperMeta">
            {UNIT}　{DATE_LABEL}　{SHIFT_TO}
          </p>
        </header>
        <div className="nippoCards kh-nippo-cards">
          <NippoCard
            name="田中"
            room="203"
            progress="朝 36.8℃ → 夕 37.4℃"
            handoff={confirmed ? "解熱剤 未投与" : "提出済"}
            notice={confirmed ? "再発熱時は看護へ" : "解熱剤を確認"}
            urgent={!confirmed}
          />
          <NippoCard name="山田" room="105" progress="特記事項なし" handoff="—" notice="—" />
          <NippoCard name="鈴木" room="208" progress="夜間トイレ 2回" handoff="—" notice="—" />
        </div>
      </article>
      <div className="dock dockSingle">
        <button type="button" className={confirmed ? "btnPrimary" : "btnPrimary btnConfirm"} disabled={confirmed}>
          {confirmed ? "確認済" : "確認"}
        </button>
      </div>
    </div>
  );
}

export const IntroScreens = memo(function IntroScreens({
  phase,
  stars,
}: {
  phase: number;
  stars: readonly DeviceId[];
}) {
  return (
    <>
      <Phone id="memo" tab="申し送り" stars={stars}>
        <MemoScreen recording={phase === 0} />
      </Phone>
      <Phone id="karte" tab="面談記録" stars={stars}>
        <KarteScreen recording={phase < 3} />
      </Phone>
      <Phone id="nippo" tab="日報" stars={stars}>
        <NippoScreen confirmed={phase >= 5} />
      </Phone>
    </>
  );
});
