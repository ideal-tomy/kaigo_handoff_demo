import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "記録",
  description: "介護施設 申し送り・面談記録",
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
