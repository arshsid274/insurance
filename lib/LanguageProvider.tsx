"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type Locale,
  type TKey,
  DICTIONARIES,
  LOCALE_META,
  detectBrowserLocale,
  isLocale,
  translate,
} from "./i18n";

const STORAGE_KEY = "medlocator.locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Render in English on first paint to avoid hydration mismatch, then switch
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const initial: Locale = stored && isLocale(stored) ? stored : detectBrowserLocale();
    if (initial !== "en") setLocaleState(initial);
  }, []);

  const dir = LOCALE_META[locale].dir;

  // Reflect locale onto <html lang> and dir so Leaflet, screen readers, and CSS pick it up
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, dir }), [locale, setLocale, t, dir]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback so a component used outside provider still renders English
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: TKey, params?: Record<string, string | number>) => translate("en", key, params),
      dir: "ltr",
    };
  }
  return ctx;
}

// Re-export for convenience
export { DICTIONARIES };
