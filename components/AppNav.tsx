"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "申し送り" },
  { href: "/karte", label: "面談記録" },
  { href: "/nippo", label: "日報" },
] as const;

export function AppNav({ title }: { title?: string }) {
  const pathname = usePathname();
  const nippoActive = pathname === "/nippo" || pathname === "/records";

  return (
    <header className="appHeader appHeaderWide">
      {title ? <h1 className="appHeaderTitle">{title}</h1> : null}
      <nav className="appNav">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`appNavLink ${
              pathname === link.href ||
              (link.href === "/" && pathname === "/memo") ||
              (link.href === "/nippo" && nippoActive)
                ? "active"
                : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
