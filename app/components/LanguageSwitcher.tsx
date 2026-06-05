"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageProvider";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n";
import { Globe, Check } from "./icons";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost !min-h-[40px] !rounded-xl !px-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher")}
        title={t("languageSwitcher")}
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span className="hidden md:inline">{LOCALE_META[locale].native}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("languageSwitcher")}
          className="absolute end-0 top-12 z-[1700] min-w-[180px] overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.15)]"
          style={{ right: 0 }}
        >
          {LOCALES.map((l: Locale) => {
            const active = l === locale;
            return (
              <li key={l} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={`row-hover flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm ${
                    active ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]" : "text-[var(--color-text)]"
                  }`}
                >
                  <span className="flex-1 font-medium" lang={l} dir={LOCALE_META[l].dir}>
                    {LOCALE_META[l].native}
                  </span>
                  <span className="text-[11px] text-[var(--color-muted)]">{LOCALE_META[l].label}</span>
                  {active && <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
