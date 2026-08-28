# kaigo_handoff_demo — 介護施設 申し送りAI

音声メモから申し送り票・経過記録のテンプレ下書きを作成し、確認して提出する体験デモ。

**本番 URL:** 未定

## 参考モック（正本ではない）

- `候補/index.html`
- `Care Facility System/申し送りAI_demo.html`
- 旧 Netlify: https://lambent-smakager-7bcf0a.netlify.app/

## セットアップ

```bash
cd kaigo_handoff_demo
npm install
cp .env.example .env.local   # 任意（Live API 用）
npm run dev
```

```env
OPENAI_API_KEY=              # 任意。未設定でもサンプル完走可
OPENAI_MODEL=gpt-4o-mini
```

## 商談での使い方

**主導線は「サンプルで試す」**（API キー・マイク不要）。

1. サンプル 3 本から 1 つ選択（例: 203 発熱）
2. 書き起こし → 申し送り票・経過記録の下書きを確認
3. 要確認欄を 1 か所修正 → 提出
4. 日勤受信画面で要対応を確認

任意: テキスト貼付 / 実マイク（Chrome 推奨）。失敗時はサンプルを使う。

## 関連ドキュメント

- 要件: `docs/kaigo_handoff_requirements.md`
- Demo Definition: `docs/kaigo_handoff_demo_definition.md`
