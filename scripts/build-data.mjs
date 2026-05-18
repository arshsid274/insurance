#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = resolve(ROOT, "MEDICAL INSURANCE NETWORK.xlsx");
const OUT = resolve(ROOT, "public/providers.json");

if (!existsSync(SOURCE)) {
  console.error(`[build-data] Source file missing: ${SOURCE}`);
  process.exit(1);
}

const COORD_RE = /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;

const NETWORK_COLS = [
  "Executive Network",
  "Comprehensive Network",
  "General Network",
  "RN Plus",
  "Restricted Network",
  "Super-Restricted Network",
  "Workers Network",
];

const TYPE_WHITELIST = new Set([
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Diagnostics",
  "Day Surgery Center",
  "Optical Center",
]);

function normalizePhone(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const digits = String(raw).replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  // UAE numbers commonly stored as 971... already
  if (/^(971|965|968|974)\d{6,}$/.test(digits)) return `+${digits}`;
  // Local with leading 0 — best-effort: drop the 0 and assume UAE
  if (digits.startsWith("0")) return `+971${digits.slice(1)}`;
  return digits.length >= 7 ? `+${digits}` : null;
}

function cleanString(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length ? s : null;
}

function parseProviders() {
  const buf = readFileSync(SOURCE);
  const wb = XLSX.read(buf, { cellDates: true });
  const seenIds = new Map();
  let totalRows = 0;
  let invalidCoords = 0;
  let zeroCoords = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

    for (const row of rows) {
      totalRows++;
      const name = cleanString(row["PROVIDER"]);
      const type = cleanString(row["TYPE"]);
      if (!name || !TYPE_WHITELIST.has(type)) continue;

      const loc = String(row["LOCATION"] ?? "");
      const m = COORD_RE.exec(loc);
      if (!m) {
        invalidCoords++;
        continue;
      }
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        invalidCoords++;
        continue;
      }
      if (lat === 0 && lng === 0) {
        zeroCoords++;
        continue;
      }

      const id = Number(row["HPROVIDERID"]) || totalRows;
      if (seenIds.has(id)) continue;

      const networks = NETWORK_COLS.filter((col) => {
        const v = row[col];
        return v && String(v).includes("✔");
      }).map((label) => label.replace(/\s+Network$/, ""));

      seenIds.set(id, {
        id,
        name,
        type,
        country: cleanString(row["COUNTRY"]) ?? "",
        region: cleanString(row["REGION"]) ?? "",
        address: cleanString(row["BUILDING ADDRESS"]) ?? "",
        phone: normalizePhone(row["TELEPHONE"]),
        lat,
        lng,
        hasDental: cleanString(row["HAS DENTAL SERVICE"]) === "Yes",
        group: cleanString(row["Provider Group"]),
        networks,
      });
    }
  }

  return {
    providers: Array.from(seenIds.values()),
    stats: { totalRows, invalidCoords, zeroCoords, kept: seenIds.size },
  };
}

const { providers, stats } = parseProviders();

writeFileSync(OUT, JSON.stringify({ providers }), "utf8");

const fileSize = (JSON.stringify({ providers }).length / 1024).toFixed(1);
const byType = providers.reduce((acc, p) => {
  acc[p.type] = (acc[p.type] ?? 0) + 1;
  return acc;
}, {});

console.log(`[build-data] Wrote ${OUT}`);
console.log(`[build-data] Total rows scanned: ${stats.totalRows}`);
console.log(`[build-data] Kept: ${stats.kept} | Invalid coords: ${stats.invalidCoords} | Zero coords: ${stats.zeroCoords}`);
console.log(`[build-data] By type:`, byType);
console.log(`[build-data] File size: ${fileSize} KB`);
