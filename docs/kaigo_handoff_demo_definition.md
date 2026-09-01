# 介護施設 記録 — Demo Definition

## 1. Demo Identity

- Demo ID: `kaigo-handoff`
- Repository: https://github.com/ideal-tomy/kaigo_handoff_demo
- Requirement File: `docs/kaigo_handoff_requirements.md`

## 2. Demo Goal

隙間録音または入力の口語が報告書へ清書されて1日分の下書きに積もり、面談は録音または入力のあと経過記録が欄ごとに埋まる。日報は確認と録音で欄が埋まる。説明なしで操作だけ伝わる。

## 3. Routes

- `/` — 申し送り
- `/memo` — 積み上げ申し送り
- `/karte` — 面談記録
- `/nippo` — 日報（確認）
- `/records` — `/nippo` と同じ

## 4. Access Mode

| モード | 説明 |
|--------|------|
| Clip tap | 時刻枠タップで録音〜下書き更新（主導線） |
| 入力 | 口語テキストをタイプして同じ清書フローへ |
| 日報録音 | フロア一巡の口語で空欄だけ摘要を埋める |
| Live Mic | Web Speech。失敗時は枠タップで完走可 |

Core / Trial: 非接続

## 5. 受け入れ条件

- [ ] 画面に「サンプル」「デモ」「推奨」がない
- [ ] /memo 3枠（録音または入力）→ 修正1 → 提出
- [ ] /karte 録音HUD または入力 → 欄の清書 → 確認（田中）→ 記録
- [ ] /nippo 確認 → 日報欄が埋まる。録音で空欄が埋まる
- [ ] build 成功
