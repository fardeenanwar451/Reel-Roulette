# Reel Roulette

A Next.js app for spinning a wheel across four Top 250 movie rankings —
**IMDb**, **Letterboxd**, **Metacritic**, and **Rotten Tomatoes** — picking one
movie at random, and tracking what you've watched with Letterboxd-style
half-star ratings.

## Stack

- **Next.js 14** (App Router) — frontend *and* backend, via Route Handlers
  (`app/api/...`). No separate Express server.
- **Prisma** — ORM/schema layer.
- **Neon** — serverless Postgres.
- **Data:** Static seed lists (title/rank/year) for each Top 250, hydrated
  with poster art, overview, runtime, and genres from **TMDB**'s free API.

This used to be a MERN (Mongo) app with a separate Express backend. It's now
a single deployable Next.js app talking directly to Postgres through Prisma.
The four list rankings, wheel mechanics, star ratings, and watched-list
sorting all work identically — only the database and how the API is hosted
changed.

```
reel-roulette/
├── app/
│   ├── api/movies/...       Route Handlers (replace the old Express routes)
│   ├── section/[source]/    The wheel page for one list
│   └── page.js               Home page (4 list cards)
├── components/                MovieWheel, StarRating, WatchedList, etc.
├── lib/
│   ├── api.js                 Frontend fetch client (now same-origin)
│   └── prisma.js              Prisma client singleton
├── prisma/schema.prisma       Movie model (Postgres)
├── data/                      Seed lists + TMDB hydration script
└── scripts/seed.js            Loads hydrated data into Neon
```

## ⚠️ A note on the "Top 250" data

There's no free, public, live-updating API for Letterboxd's, Metacritic's, or
Rotten Tomatoes' Top 250 lists (Letterboxd has no public API at all; the
others don't expose ranked lists either). IMDb's isn't available through a
clean free API either.

So: **the title/year/rank for all four lists in `data/lists/` are curated
snapshots**, not a live scrape — built to genuinely reflect each platform's
character, but they'll drift from the real current rankings over time, same
as any "top 250" list does.

**Poster art, overviews, runtime, and genres ARE live** — pulled from TMDB
each time you run the hydration script. See the original project notes if
you want to swap in a different/more current title list — `data/lists/*.js`
is just an array of `{ rank, title, year }`.

## Setup

### 1. Create a free Neon project

Sign up at [neon.tech](https://neon.tech) → New Project. On the project
dashboard, open **Connection Details** and copy two connection strings:

- The **pooled** one (hostname contains `-pooler`) → `DATABASE_URL`
- The **direct/unpooled** one (no `-pooler`) → `DATABASE_URL_UNPOOLED`

Prisma needs both: the pooled one for normal app queries (handles serverless
connection limits), the direct one for schema migrations, which don't work
reliably through a connection pooler.

### 2. Get a free TMDB API key

Sign up at [themoviedb.org](https://www.themoviedb.org/signup), then grab a
v3 API key from **Settings → API**: https://www.themoviedb.org/settings/api

### 3. Install and configure

```bash
npm install
cp .env.example .env        # paste in DATABASE_URL, DATABASE_URL_UNPOOLED, TMDB_API_KEY
```

### 4. Push the schema to Neon

```bash
npm run db:push
```

This creates the `Movie` table (and the `Source`/`Status` enums) in your Neon
database. No migration files needed for this project size — `db push` syncs
the schema directly, which is the simplest option for a solo project. (If you
later want versioned migrations for a team project, swap this for
`prisma migrate dev`.)

### 5. Hydrate the movie data

```bash
cd data
npm install
npm run hydrate
```

This reads `TMDB_API_KEY` from the same `.env` file at the project root you
already set up in step 3 — no separate `.env` needed inside `data/`.

This calls TMDB once per movie (1,000 calls total across all four lists) and
writes `data/hydrated/<source>.json`. It's rate-limited to be polite to TMDB's
free tier, so it takes a few minutes.

### 6. Seed Neon

```bash
cd ..              # back to project root
npm run seed
```

### 7. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## How the wheel works

- Each section's wheel only contains movies still marked `wheel` (not yet
  watched).
- **Spin it** with the button, or **grab and flick** the wheel itself with
  your mouse or finger — release velocity carries into the spin.
- Whichever poster lands under the pointer becomes your pick: it's marked
  `watched` and removed from the wheel.
- The pick is added to the **Watched & tracked** list below (collapsed by
  default).
- Rate it 0–5 stars in half-point steps, gold-fill like Letterboxd.
- Sort the watched list by **Recent** or **Top rated**.
- The ↺ button on a watched entry puts it back on the wheel and clears its
  rating.

## API reference

Same endpoints as before, just served by Next.js Route Handlers instead of
Express, and same-origin (no separate base URL):

| Method | Route                          | Description                                  |
|--------|---------------------------------|-----------------------------------------------|
| GET    | `/api/movies/:source`           | Full list for a source, sorted by rank        |
| GET    | `/api/movies/:source/wheel`     | Only un-watched movies                        |
| GET    | `/api/movies/:source/watched`   | Only watched movies (`?sort=rating` to sort)  |
| PATCH  | `/api/movies/:id/watch`         | Mark a movie watched                          |
| PATCH  | `/api/movies/:id/rate`          | Set rating (`{ "rating": 4.5 }`, or `null`)   |
| PATCH  | `/api/movies/:id/reset`         | Move a watched movie back to the wheel        |

`:source` is one of `imdb`, `letterboxd`, `metacritic`, `rt`. `:id` is now a
Prisma-generated UUID string (was a Mongo ObjectId before — if you're
migrating data over rather than re-seeding fresh, note IDs are not portable
between the two).

## Deployment (Vercel)

This is now a single deployable app, which is simpler than the old two-app
setup:

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add environment variables in the Vercel project settings:
   - `DATABASE_URL` (pooled Neon string)
   - `DATABASE_URL_UNPOOLED` (direct Neon string)
4. Deploy. Vercel auto-detects Next.js — no build config needed. The
   `postinstall` script runs `prisma generate` automatically during the build.
5. Run `npm run db:push` and `npm run seed` once **against your production
   Neon database** (from your local machine — both just need network access
   to Neon, which is already the case since it's the same database you've
   been using).

After that, every `git push` auto-redeploys on Vercel.

## Extending it

- More sources: Sight & Sound, AFI Top 100, a Letterboxd watchlist CSV import.
- A "weighted wheel" mode where higher-ranked movies get a bigger slice.
- Genre filters before spinning.
- Export your watched + rated list as a shareable image or CSV.
- Swap `prisma db push` for `prisma migrate dev` if this grows into a
  multi-environment / team project and you want tracked migration history.
