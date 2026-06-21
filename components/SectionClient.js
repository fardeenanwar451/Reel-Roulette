"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, getSourceMeta } from "@/lib/api";
import MovieWheel from "@/components/MovieWheel";
import ResultReveal from "@/components/ResultReveal";
import WatchedList from "@/components/WatchedList";

export default function SectionClient({ sourceKey }) {
  const meta = getSourceMeta(sourceKey);

  const [wheelMovies, setWheelMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealMovie, setRevealMovie] = useState(null);
  const [busy, setBusy] = useState(false);

  const totalCount = wheelMovies.length + watchedMovies.length;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wheel, watched] = await Promise.all([
        api.getWheel(sourceKey),
        api.getWatched(sourceKey),
      ]);
      setWheelMovies(wheel);
      setWatchedMovies(watched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sourceKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = useCallback(
    async (movie) => {
      if (!movie || busy) return;
      setBusy(true);
      try {
        const updated = await api.markWatched(movie.id);
        setWheelMovies((prev) => prev.filter((m) => m.id !== movie.id));
        setWatchedMovies((prev) => [updated, ...prev]);
        setRevealMovie(updated);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const handleRate = useCallback(async (id, rating) => {
    try {
      const updated = await api.rate(id, rating);
      setWatchedMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleReset = useCallback(async (id) => {
    try {
      const updated = await api.reset(id);
      setWatchedMovies((prev) => prev.filter((m) => m.id !== id));
      setWheelMovies((prev) => [...prev, updated].sort((a, b) => a.rank - b.rank));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return (
    <main className="min-h-screen bg-ink bg-noise text-bone">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-violet-300/70 transition-colors hover:text-violet-200"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M11 1L4 7l7 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          All lists
        </Link>

        <header className="mt-6 mb-12 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300/70">
            Top 250
          </span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl text-bone">
            {meta?.name || sourceKey}
          </h1>
          <p className="mt-2 text-violet-200/70">{meta?.tagline}</p>
        </header>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-950/30 px-5 py-4 text-red-200">
            {error}{" "}
            <button onClick={loadData} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-700 border-t-violet-300" />
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <MovieWheel movies={wheelMovies} onSelect={handleSelect} disabled={busy} />
            </div>

            <div className="mt-16 flex justify-center">
              <WatchedList
                movies={watchedMovies}
                onRate={handleRate}
                onReset={handleReset}
                totalCount={totalCount}
              />
            </div>
          </>
        )}
      </div>

      <ResultReveal
        movie={revealMovie}
        onClose={() => setRevealMovie(null)}
        onRateNow={() => setRevealMovie(null)}
      />
    </main>
  );
}
