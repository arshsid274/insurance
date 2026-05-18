"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "./icons";

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(local), 120);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [local, onChange]);

  return (
    <div className="relative">
      <label htmlFor="provider-search" className="sr-only">
        Search providers
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="provider-search"
        type="search"
        placeholder="Search by name, region, or group…"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
        className="block h-10 w-full rounded-xl border border-[var(--color-line)] bg-white pl-9 pr-9 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
      />
      {local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--color-muted)] hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
