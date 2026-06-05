"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, X } from "./icons";
import { useLanguage } from "@/lib/LanguageProvider";

type Platform = "ios" | "android" | "mac" | "windows" | "linux" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh/.test(ua)) return "mac";
  if (/Windows/.test(ua)) return "windows";
  if (/Linux/.test(ua)) return "linux";
  return "unknown";
}

const INSTRUCTIONS: Record<Platform, string[]> = {
  ios: [
    "Open Settings → Privacy & Security → Location Services",
    "Make sure Location Services is on",
    "Scroll to Safari → set to “Ask” or “Allow”",
    "Return to this page and tap “Use my location” again",
  ],
  android: [
    "Tap the lock icon in the address bar",
    "Tap Permissions → Location",
    "Set to “Allow”",
    "Reload this page and tap “Use my location”",
  ],
  mac: [
    "Click the lock icon next to the URL",
    "Set Location to “Allow”",
    "Reload the page",
  ],
  windows: [
    "Click the lock icon in the address bar",
    "Reset Location permission",
    "Reload and tap “Use my location” again",
  ],
  linux: [
    "Click the lock icon in the address bar",
    "Reset Location permission and reload",
  ],
  unknown: [
    "Open your browser site settings for this page",
    "Set Location to Allow and reload",
  ],
};

export default function PermissionDeniedModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [platform, setPlatform] = useState<Platform>("unknown");
  useEffect(() => setPlatform(detectPlatform()), []);
  const steps = INSTRUCTIONS[platform];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="denied-title"
      className="fixed inset-0 z-[2100] grid place-items-center bg-[rgba(8,42,49,0.55)] p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <TriangleAlert className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 id="denied-title" className="font-display text-[18px] font-semibold text-[var(--color-text)]">
              {t("deniedTitle")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              {t("deniedBody")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("closeDetails")}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-[13px] leading-relaxed text-[var(--color-text)]">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-semibold text-[var(--color-primary-deep)]">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onClose} className="btn-ghost mt-4 w-full">
          {t("continueWithout")}
        </button>
      </div>
    </div>
  );
}
