# 介護施設 申し送りAI — Demo Definition

## 1. Demo Identity

- Demo ID: `kaigo-handoff`
- Demo Name: 介護施設 申し送りAI
- Repository: `kaigo_handoff_demo`（https://github.com/ideal-tomy/kaigo_handoff_demo）
- Production URL: 未定
- Demo Type: Workflow / Audio
- Requirement File: `docs/kaigo_handoff_requirements.md`
- Legacy Mock: `候補/index.html`, `Care Facility System/申し送りAI_demo.html`

## 2. Demo Goal

### 証明すること

音声メモから、申し送り票と経過記録のテンプレ下書きが埋まり、人が確認して提出できる。

### 理想状態

「夜勤終わりにこれなら書ける。次の人も何をすればいいか分かる」

### 最重要価値

- 実務感
- 導入後の想像しやすさ
- 分かりやすさ

## 3. Common Core Integration

**本デモはスタンドアロン。`@axeon/ai-demo-core` / Trial は Phase 1 では接続しない。**

- AI 接続: 任意で `/api/generate` から OpenAI（キーあり時のみ）
- サンプルモード: クライアント側モック（キー不要）
- BYOK: `.env.local` の `OPENAI_API_KEY`（サーバーのみ）

## 4. Access Mode

| モード | 説明 |
|--------|------|
| Sample | 3 シナリオのサンプル再生。API 非呼び出し。商談の主導線 |
| Live Text | テキスト貼付 → クライアント整形 or API |
| Live Mic | Web Speech API。失敗時は Sample へ誘導 |

## 5. UI / シナリオ

1. コンテキスト表示（2F さくら / 夜勤 → 日勤）
2. サンプル選択 or マイク or テキスト貼付
3. 書き起こし表示
4. 申し送り票・経過記録タブで下書き表示
5. 要確認欄を編集
6. 下書き → 確認済 → 提出済
7. 日勤受信一覧（要対応優先）

## 6. 演出

- Loading: 再生 → 書き起こし → テンプレ化
- Before/After: 手書き約 8 分 vs 確認約 45 秒
- 欄が順に埋まる（サンプルモード）
- 提出完了: 受信画面へ

## 7. Input / Output

### Input

- Audio Sample（`public/audio/*.mp3` または再生 UI モック）
- Text（貼付）
- Live Mic（Web Speech）

### Output

- HandoffDraft（申し送り票）
- ProgressNote（経過記録）
- InboxItem（受信一覧）

## 8. 受け入れ条件

- [ ] サンプル 3 本がキーなしで完走
- [ ] 1 項目の編集後に提出できる
- [ ] 受信画面で要対応が目立つ
- [ ] 絵文字 UI なし
- [ ] `npm run build` 成功
