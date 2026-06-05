#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = resolve(ROOT, "MEDICAL INSURANCE NETWORK.xlsx");
const OUT = resolve(ROOT, "public/providers.json");
const CACHE = resolve(ROOT, "data/geocoding-cache.json");

if (!existsSync(SOURCE)) {
  console.error(`[build-data] Source file missing: ${SOURCE}`);
  process.exit(1);
}

// ── Bigram similarity for the cache merge (same logic as verify-addresses.mjs)
function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function bigrams(s) {
  const out = new Set();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}
function bigramScore(a, b) {
  const A = bigrams(normalize(a));
  const B = bigrams(normalize(b));
  if (A.size === 0 || B.size === 0) return 0;
  let hit = 0;
  for (const bg of A) if (B.has(bg)) hit++;
  return (2 * hit) / (A.size + B.size);
}
function haversineM(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function shouldReplaceFromCache(provider, googleResult) {
  if (!googleResult || !googleResult.location) return false;
  const gLat = googleResult.location.latitude;
  const gLng = googleResult.location.longitude;
  const distM = haversineM({ lat: provider.lat, lng: provider.lng }, { lat: gLat, lng: gLng });
  if (distM > 10_000) return false;
  const nameScore = bigramScore(provider.name, googleResult.displayName?.text || "");
  const addrScore = bigramScore(provider.address || "", googleResult.formattedAddress || "");
  if (nameScore >= 0.7 && distM < 2000) return true;
  if (addrScore >= 0.6 && distM < 500) return true;
  if (distM < 100) return true;
  return false;
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

// Merge verified coords from data/geocoding-cache.json if present.
let mergedFromCache = 0;
if (existsSync(CACHE)) {
  try {
    const cache = JSON.parse(readFileSync(CACHE, "utf8"));
    for (const p of providers) {
      const cached = cache[String(p.id)];
      const result = cached?.response;
      if (!result) continue;
      if (shouldReplaceFromCache(p, result)) {
        p.lat = result.location.latitude;
        p.lng = result.location.longitude;
        mergedFromCache++;
      }
    }
  } catch (err) {
    console.warn(`[build-data] Failed to read cache ${CACHE}: ${err.message}`);
  }
}

writeFileSync(OUT, JSON.stringify({ providers }), "utf8");

const fileSize = (JSON.stringify({ providers }).length / 1024).toFixed(1);
const byType = providers.reduce((acc, p) => {
  acc[p.type] = (acc[p.type] ?? 0) + 1;
  return acc;
}, {});

console.log(`[build-data] Wrote ${OUT}`);
console.log(`[build-data] Total rows scanned: ${stats.totalRows}`);
console.log(`[build-data] Kept: ${stats.kept} | Invalid coords: ${stats.invalidCoords} | Zero coords: ${stats.zeroCoords}`);
if (existsSync(CACHE)) {
  console.log(`[build-data] Merged verified coords from cache for ${mergedFromCache} providers`);
}
console.log(`[build-data] By type:`, byType);
console.log(`[build-data] File size: ${fileSize} KB`);
