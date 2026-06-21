// scripts/seed.js
// Loads the hydrated JSON files (produced by data/hydrate.js) into Neon Postgres via Prisma.
// Run from the project root with: npm run seed
//
// Expects ./data/hydrated/<source>.json to exist (imdb.json, letterboxd.json, metacritic.json, rt.json).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HYDRATED_DIR = path.join(__dirname, "../data/hydrated");
const SOURCES = ["imdb", "letterboxd", "metacritic", "rt"];

async function seedSource(sourceKey) {
  const filePath = path.join(HYDRATED_DIR, `${sourceKey}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`  Skipping ${sourceKey}: ${filePath} not found. Run data/hydrate.js first.`);
    return;
  }

  const records = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Re-seeding is idempotent and preserves any existing watched/rating state,
  // matched by (source, rank) — same approach as the original Mongoose seed script.
  const existing = await prisma.movie.findMany({ where: { source: sourceKey } });
  const existingByRank = new Map(existing.map((m) => [m.rank, m]));

  let upserted = 0;
  for (const rec of records) {
    const prior = existingByRank.get(rec.rank);
    await prisma.movie.upsert({
      where: { source_rank_unique: { source: sourceKey, rank: rec.rank } },
      create: {
        ...rec,
        status: prior?.status ?? "wheel",
        rating: prior?.rating ?? null,
        watchedAt: prior?.watchedAt ?? null,
      },
      update: {
        title: rec.title,
        year: rec.year,
        tmdbId: rec.tmdbId,
        posterUrl: rec.posterUrl,
        backdropUrl: rec.backdropUrl,
        overview: rec.overview,
        runtime: rec.runtime,
        genres: rec.genres,
        // status/rating/watchedAt are intentionally NOT overwritten on update —
        // re-hydrating posters shouldn't wipe out what you've already watched/rated.
      },
    });
    upserted++;
  }

  console.log(`  ${sourceKey}: upserted ${upserted} records`);
}

async function main() {
  console.log("Seeding movies into Neon Postgres...");
  for (const source of SOURCES) {
    await seedSource(source);
  }
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
