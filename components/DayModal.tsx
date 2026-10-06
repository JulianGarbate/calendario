"use client";

import { useEffect } from "react";
import { addDays } from "@/lib/dates";
import DayDetail, { longDate } from "./DayDetail";

const Chevron = ({ dir }: { dir: "l" | "r" }) => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === "l" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
  </svg>
);

export default function DayModal({ date, onClose, onNav, onChange }: { date: string; onClose: () => void; onNav: (d: string) => void; onChange: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={longDate(date)}
        className="sheet max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => onNav(addDays(date, -1))} className="btn !px-2.5" aria-label="Día anterior"><Chevron dir="l" /></button>
          <h2 className="text-base font-semibold">{longDate(date)}</h2>
          <button onClick={() => onNav(addDays(date, 1))} className="btn !px-2.5" aria-label="Día siguiente"><Chevron dir="r" /></button>
        </div>
        <DayDetail date={date} onChange={onChange} />
        <button onClick={onClose} className="btn mt-5 w-full">Listo</button>
      </div>
    </div>
  );
}
