# 介護施設 記録 — Demo Definition

## 1. Demo Identity

- Demo ID: `kaigo-handoff`
- Repository: https://github.com/ideal-tomy/kaigo_handoff_demo
- Requirement File: `docs/kaigo_handoff_requirements.md`

## 2. Demo Goal

隙間録音が1日分の下書きに積もり、面談録音が本人の言葉つき記録になる。説明なしで操作だけ伝わる。

## 3. Routes

- `/` — ハブ（申し送り | 面談記録）
- `/memo` — 積み上げ申し送り
- `/karte` — 面談記録

## 4. Access Mode

| モード | 説明 |
|--------|------|
| Clip tap | 時刻枠タップで録音〜下書き更新（主導線） |
| Live Mic | Web Speech。失敗時は枠タップで完走可 |

Core / Trial: 非接続

## 5. 受け入れ条件

- [ ] 画面に「サンプル」「デモ」「推奨」がない
- [ ] /memo 3枠 → 修正1 → 提出
- [ ] /karte 同意 → 録音 → 記録
- [ ] build 成功
