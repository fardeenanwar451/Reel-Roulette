import Link from "next/link";
import { SOURCES } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink bg-noise text-bone">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <header className="mb-16 sm:mb-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300 mb-4">
            Four lists. One spin.
          </p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] text-balance">
            Reel <span className="text-violet-300 italic">Roulette</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-violet-100/80 text-balance">
            Pick a ranking, spin the wheel, and let chance choose your next
            watch from each list&rsquo;s top 250. Every pick gets tracked, rated,
            and sorted once you&rsquo;re done.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SOURCES.map((source, i) => (
            <Link
              key={source.key}
              href={`/section/${source.key}`}
              className="group relative overflow-hidden rounded-2xl border border-violet-800/40 bg-surface2 p-8 transition-all hover:border-violet-400/60 hover:shadow-glow focus-visible:border-violet-400/60"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${source.accent} opacity-20 blur-3xl transition-opacity group-hover:opacity-35`}
              />
              <div className="relative">
                <span className="font-mono text-xs uppercase tracking-widest text-violet-300/70">
                  Top 250
                </span>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
                  {source.name}
                </h2>
                <p className="mt-3 text-violet-100/70">{source.tagline}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition-transform group-hover:translate-x-1">
                  Spin the wheel
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h10m0 0L9 4m4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-20 text-sm text-violet-300/50">
          Posters & details via TMDB. List snapshots are curated, not live-scraped —
          see the README to refresh them.
        </footer>
      </div>
    </main>
  );
}
