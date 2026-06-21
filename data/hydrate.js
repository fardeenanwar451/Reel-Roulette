// hydrate.js
// Looks up every movie in our seed lists against TMDB and writes out fully-hydrated
// JSON files (one per source) containing poster paths, overviews, runtime, genres, etc.
//
// Usage:
//   TMDB_API_KEY=xxxx node hydrate.js
//
// Get a free TMDB API key (v3 auth) at https://www.themoviedb.org/settings/api
//
// Output: ./hydrated/<source>.json  — array of fully-formed Movie records ready for Prisma seeding.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

import { imdbTop250 } from "./lists/imdb.js";
import { letterboxdTop250 } from "./lists/letterboxd.js";
import { metacriticTop250 } from "./lists/metacritic.js";
import { rtTop250 } from "./lists/rt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from the project root (one level up from data/), regardless of
// the directory this script is run from — keeps a single .env file for the
// whole project instead of a separate one just for hydration.
dotenv.config({ path: path.join(__dirname, "../.env") });

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

if (!TMDB_KEY) {
  console.error("Missing TMDB_API_KEY. Set it in data/.env or as an env var.");
  process.exit(1);
}

const SOURCES = {
  imdb: imdbTop250,
  letterboxd: letterboxdTop250,
  metacritic: metacriticTop250,
  rt: rtTop250,
};

// Simple delay helper so we don't hammer TMDB's rate limit.
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function searchMovie(title, year) {
  const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
    title
  )}&year=${year}&include_adult=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB search failed (${res.status}) for "${title}"`);
  const data = await res.json();
  if (data.results && data.results.length > 0) return data.results[0];

  // Retry without year constraint — some titles are mis-dated by a year across sources.
  const fallbackUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
    title
  )}&include_adult=false`;
  const fallbackRes = await fetch(fallbackUrl);
  const fallbackData = await fallbackRes.json();
  return fallbackData.results?.[0] || null;
}

async function getDetails(tmdbId) {
  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB details failed (${res.status}) for id ${tmdbId}`);
  return res.json();
}

async function hydrateSource(sourceKey, list) {
  console.log(`\nHydrating ${sourceKey} (${list.length} titles)...`);
  const results = [];
  const misses = [];

  for (const entry of list) {
    try {
      const found = await searchMovie(entry.title, entry.year);
      if (!found) {
        misses.push(entry);
        results.push({
          source: sourceKey,
          rank: entry.rank,
          title: entry.title,
          year: entry.year,
          tmdbId: null,
          posterUrl: null,
          backdropUrl: null,
          overview: null,
          runtime: null,
          genres: [],
          status: "wheel",
          rating: null,
          watchedAt: null,
        });
        continue;
      }

      const details = await getDetails(found.id);

      results.push({
        source: sourceKey,
        rank: entry.rank,
        title: entry.title,
        year: entry.year,
        tmdbId: found.id,
        posterUrl: found.poster_path ? `${IMAGE_BASE}${found.poster_path}` : null,
        backdropUrl: found.backdrop_path ? `${IMAGE_BASE}${found.backdrop_path}` : null,
        overview: details.overview || found.overview || "",
        runtime: details.runtime || null,
        genres: (details.genres || []).map((g) => g.name),
        status: "wheel",
        rating: null,
        watchedAt: null,
      });

      process.stdout.write(".");
    } catch (err) {
      console.error(`\n  Error on "${entry.title}" (${entry.year}):`, err.message);
      misses.push(entry);
      results.push({
        source: sourceKey,
        rank: entry.rank,
        title: entry.title,
        year: entry.year,
        tmdbId: null,
        posterUrl: null,
        backdropUrl: null,
        overview: null,
        runtime: null,
        genres: [],
        status: "wheel",
        rating: null,
        watchedAt: null,
      });
    }

    await sleep(60); // be polite to TMDB's free tier rate limit
  }

  console.log(`\n${sourceKey}: ${results.length - misses.length}/${results.length} matched.`);
  if (misses.length) {
    console.log(
      `  Unmatched (kept with null poster, fix manually if needed): ${misses
        .map((m) => `${m.title} (${m.year})`)
        .join(", ")}`
    );
  }

  return results;
}

async function main() {
  const outDir = path.join(__dirname, "hydrated");
  fs.mkdirSync(outDir, { recursive: true });

  for (const [sourceKey, list] of Object.entries(SOURCES)) {
    const hydrated = await hydrateSource(sourceKey, list);
    const outPath = path.join(outDir, `${sourceKey}.json`);
    fs.writeFileSync(outPath, JSON.stringify(hydrated, null, 2));
    console.log(`  Wrote ${outPath}`);
  }

  console.log("\nDone. Run `npm run seed` (from the project root) to load these into Neon Postgres.");
}

main();
