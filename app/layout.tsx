import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "申し送りAI デモ",
  description:
    "音声メモから申し送り票・経過記録のテンプレ下書きを作成し、確認して提出する介護施設向けデモ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
