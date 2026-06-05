#!/usr/bin/env node
// Verify every provider against Google Places API (Text Search New).
// Idempotent: results cached in data/geocoding-cache.json; re-runs only fetch new providers.
// Run with: node --env-file=.env.local scripts/verify-addresses.mjs

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PROVIDERS = resolve(ROOT, "public/providers.json");
const CACHE = resolve(ROOT, "data/geocoding-cache.json");
const REPORT = resolve(ROOT, "data/verification-report.csv");

const API = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.businessStatus",
].join(",");

const RATE_LIMIT_QPS = 8; // ≈ 480 QPM, comfortably under Google's 600 QPM
const MAX_RETRIES_RATE = 5;
const MAX_RETRIES_5XX = 3;

const COUNTRY_BIAS = {
  "United Arab Emirates": {
    rectangle: { low: { latitude: 22.6, longitude: 51.0 }, high: { latitude: 26.1, longitude: 56.5 } },
    regionCode: "AE",
  },
  Kuwait: {
    rectangle: { low: { latitude: 28.5, longitude: 46.5 }, high: { latitude: 30.1, longitude: 48.5 } },
    regionCode: "KW",
  },
  Oman: {
    rectangle: { low: { latitude: 16.6, longitude: 51.9 }, high: { latitude: 26.5, longitude: 59.9 } },
    regionCode: "OM",
  },
  Qatar: {
    rectangle: { low: { latitude: 24.4, longitude: 50.7 }, high: { latitude: 26.2, longitude: 51.7 } },
    regionCode: "QA",
  },
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ─── Places API client with throttle + retry ───────────────────────────────────

class Throttle {
  constructor(qps) {
    this.intervalMs = 1000 / qps;
    this.lastAt = 0;
  }
  async wait() {
    const now = Date.now();
    const next = this.lastAt + this.intervalMs;
    if (now < next) await sleep(next - now);
    this.lastAt = Math.max(now, next);
  }
}

async function searchText({ apiKey, query, bias, regionCode, signal }) {
  const body = {
    textQuery: query,
    languageCode: "en",
    maxResultCount: 1,
  };
  if (bias) body.locationBias = { rectangle: bias };
  if (regionCode) body.regionCode = regionCode;

  let rateAttempts = 0;
  let serverAttempts = 0;

  while (true) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (res.status === 200) {
      const json = await res.json();
      const places = json.places || [];
      return places[0] || null;
    }

    if (res.status === 429) {
      rateAttempts++;
      if (rateAttempts > MAX_RETRIES_RATE) {
        throw new Error(`Rate limit exceeded after ${MAX_RETRIES_RATE} retries`);
      }
      const wait = Math.min(60_000, 2_000 * Math.pow(2, rateAttempts - 1));
      console.warn(`  [429] rate-limited, sleeping ${wait}ms (attempt ${rateAttempts})`);
      await sleep(wait);
      continue;
    }

    if (res.status >= 500) {
      serverAttempts++;
      if (serverAttempts > MAX_RETRIES_5XX) {
        throw new Error(`Server error ${res.status} after ${MAX_RETRIES_5XX} retries`);
      }
      await sleep(1000 * serverAttempts);
      continue;
    }

    // 4xx other than 429: bad request, key invalid, etc. — surface immediately
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text}`);
  }
}

// ─── Decision logic ────────────────────────────────────────────────────────────

function buildQuery(p) {
  const parts = [p.name, p.address, p.region, p.country].map((x) => (x || "").trim()).filter(Boolean);
  return parts.join(", ").replace(/\s+/g, " ");
}

function decide(provider, googleResult) {
  if (!googleResult || !googleResult.location) {
    return {
      decision: "keep_original",
      reason: "no_google_match",
      googleLat: null,
      googleLng: null,
      distanceM: null,
      nameScore: 0,
      addrScore: 0,
      googleName: "",
      googleAddress: "",
      googleId: "",
    };
  }

  const gLat = googleResult.location.latitude;
  const gLng = googleResult.location.longitude;
  const distM = haversineM({ lat: provider.lat, lng: provider.lng }, { lat: gLat, lng: gLng });
  const gName = googleResult.displayName?.text || "";
  const gAddr = googleResult.formattedAddress || "";
  const nameScore = bigramScore(provider.name, gName);
  const addrScore = bigramScore(provider.address || "", gAddr);

  const base = {
    googleLat: gLat,
    googleLng: gLng,
    distanceM: distM,
    nameScore,
    addrScore,
    googleName: gName,
    googleAddress: gAddr,
    googleId: googleResult.id || "",
  };

  if (distM > 10_000) {
    return { decision: "flag", reason: "large_discrepancy", ...base };
  }

  if (googleResult.businessStatus === "CLOSED_PERMANENTLY") {
    if (nameScore >= 0.7) {
      return { decision: "replace", reason: "closed_business", ...base };
    }
  }

  if (nameScore >= 0.7 && distM < 2000) {
    return { decision: "replace", reason: "high_confidence_name_match", ...base };
  }

  if (addrScore >= 0.6 && distM < 500) {
    return { decision: "replace", reason: "high_confidence_address_match", ...base };
  }

  if (distM < 100) {
    // Very close anyway — trust Google for refinement
    return { decision: "replace", reason: "close_proximity_refinement", ...base };
  }

  return { decision: "keep_original", reason: "weak_confidence", ...base };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY missing in .env.local");
    process.exit(1);
  }

  const providers = JSON.parse(await readFile(PROVIDERS, "utf8")).providers;
  let cache = {};
  if (await fileExists(CACHE)) {
    cache = JSON.parse(await readFile(CACHE, "utf8"));
  }

  const toFetch = providers.filter((p) => !(String(p.id) in cache));
  const cachedCount = providers.length - toFetch.length;

  console.log(`[verify] Loaded ${providers.length} providers (${cachedCount} cached, ${toFetch.length} to geocode)`);

  if (toFetch.length > 0) {
    const throttle = new Throttle(RATE_LIMIT_QPS);
    let done = 0;
    let fetched = 0;
    const startedAt = Date.now();

    for (const p of toFetch) {
      await throttle.wait();
      const country = p.country || "United Arab Emirates";
      const biasCfg = COUNTRY_BIAS[country];
      const query = buildQuery(p);

      try {
        const result = await searchText({
          apiKey,
          query,
          bias: biasCfg?.rectangle,
          regionCode: biasCfg?.regionCode,
        });
        cache[String(p.id)] = {
          query,
          fetched_at: new Date().toISOString(),
          response: result,
        };
        fetched++;
      } catch (err) {
        console.error(`  [${p.id}] ${p.name} → error: ${err.message}`);
        cache[String(p.id)] = {
          query,
          fetched_at: new Date().toISOString(),
          response: null,
          error: String(err.message || err),
        };
      }

      done++;
      if (done % 50 === 0 || done === toFetch.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        const rate = (fetched / elapsed).toFixed(1);
        const remaining = toFetch.length - done;
        const etaSec = remaining / Math.max(1, fetched / elapsed);
        console.log(
          `[verify] ${done}/${toFetch.length} (${rate} req/s, ETA ${Math.round(etaSec)}s)`,
        );
        // Periodic save so a crash doesn't lose progress
        await writeFile(CACHE, JSON.stringify(cache, null, 2));
      }
    }

    await writeFile(CACHE, JSON.stringify(cache, null, 2));
  } else {
    console.log("[verify] Cache fully populated — no API calls needed");
  }

  // Apply decisions, rewrite providers.json, write report
  const summary = { replace: 0, keep_original: 0, flag: 0, no_match: 0 };
  const reportRows = [
    [
      "id",
      "name",
      "type",
      "region",
      "original_lat",
      "original_lng",
      "google_lat",
      "google_lng",
      "distance_m",
      "name_score",
      "addr_score",
      "decision",
      "reason",
      "google_place_id",
      "google_name",
      "google_address",
    ],
  ];

  const updated = providers.map((p) => {
    const cached = cache[String(p.id)];
    const result = cached?.response ?? null;
    const d = decide(p, result);
    summary[d.decision] = (summary[d.decision] || 0) + 1;
    if (!result) summary.no_match++;
    reportRows.push([
      p.id,
      p.name,
      p.type,
      p.region,
      p.lat,
      p.lng,
      d.googleLat ?? "",
      d.googleLng ?? "",
      d.distanceM == null ? "" : d.distanceM.toFixed(1),
      d.nameScore.toFixed(3),
      d.addrScore.toFixed(3),
      d.decision,
      d.reason,
      d.googleId,
      d.googleName,
      d.googleAddress,
    ]);
    if (d.decision === "replace") {
      return { ...p, lat: d.googleLat, lng: d.googleLng };
    }
    return p;
  });

  const csv = reportRows.map((row) => row.map(csvEscape).join(",")).join("\n");
  await writeFile(REPORT, csv);
  await writeFile(PROVIDERS, JSON.stringify({ providers: updated }));

  console.log("");
  console.log(`[verify] Done.`);
  console.log(`  replaced       : ${summary.replace}`);
  console.log(`  kept_original  : ${summary.keep_original}`);
  console.log(`  flagged        : ${summary.flag}`);
  console.log(`  no_google_match: ${summary.no_match}`);
  console.log(`[verify] Wrote ${CACHE}`);
  console.log(`[verify] Wrote ${REPORT}`);
  console.log(`[verify] Wrote ${PROVIDERS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
