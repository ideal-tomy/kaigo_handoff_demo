import Link from "next/link";

export function HubView() {
  return (
    <div className="appShell">
      <header className="appHeader">
        <h1 className="appHeaderTitle hubTitle">記録</h1>
      </header>
      <div className="hubGrid">
        <Link href="/memo" className="hubTile">
          申し送り
        </Link>
        <Link href="/karte" className="hubTile">
          面談記録
        </Link>
      </div>
    </div>
  );
}
