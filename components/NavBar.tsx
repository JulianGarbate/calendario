"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Calendario" },
  { href: "/stats", label: "Estadísticas" },
  { href: "/config", label: "Ajustes" },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6" aria-label="Principal">
        <span className="hidden text-[15px] font-semibold sm:block">Tracker</span>
        <div className="flex gap-1 rounded-[10px] bg-fill p-0.5">
          {LINKS.map((l) => {
            const on = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  on ? "bg-card shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
