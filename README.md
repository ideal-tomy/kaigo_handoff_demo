# kaigo_handoff_demo

介護施設向け。隙間メモの積み上げによる申し送りと、会話の面談記録。

**リポジトリ:** https://github.com/ideal-tomy/kaigo_handoff_demo

## セットアップ

```bash
cd kaigo_handoff_demo
npm install
npm run dev
```

## ルート

| パス | 内容 |
|------|------|
| `/` | 申し送り。10:00 / 12:30 / 16:45 を録音または入力 → 提出 |
| `/karte` | 面談記録。録音または入力 → 経過記録が埋まる → 記録する |
| `/nippo` | 日報。確認待ちを確認。録音で空欄を埋める |
| `/memo` | `/` と同じ |

## ドキュメント

- `docs/kaigo_handoff_requirements.md`
- `docs/kaigo_handoff_demo_definition.md`
