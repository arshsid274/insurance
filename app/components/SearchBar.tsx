"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, MapPin } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";

export default function SearchBar({
  value,
  onChange,
  includeAddress,
  onToggleIncludeAddress,
}: {
  value: string;
  onChange: (v: string) => void;
  includeAddress: boolean;
  onToggleIncludeAddress: () => void;
}) {
  const { t } = useLanguage();
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
        {t("searchPlaceholderName")}
      </label>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="provider-search"
        type="search"
        placeholder={includeAddress ? t("searchPlaceholderAddress") : t("searchPlaceholderName")}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
        className="block h-10 w-full rounded-xl border border-[var(--color-line)] bg-white ps-9 pe-24 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
      />
      <div className="absolute end-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <button
          type="button"
          role="switch"
          aria-checked={includeAddress}
          aria-label={includeAddress ? t("addressToggleOn") : t("addressToggleOff")}
          title={includeAddress ? t("addressToggleOn") : t("addressToggleOff")}
          onClick={onToggleIncludeAddress}
          className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
            includeAddress
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]"
              : "text-[var(--color-muted)] hover:bg-slate-100"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("addressToggleLabel")}</span>
        </button>
        {local && (
          <button
            type="button"
            aria-label={t("clearSearch")}
            onClick={() => {
              setLocal("");
              inputRef.current?.focus();
            }}
            className="grid h-7 w-7 place-items-center rounded-full text-[var(--color-muted)] hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
