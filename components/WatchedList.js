"use client";

import { useState, useMemo } from "react";
import StarRating from "./StarRating";

export default function WatchedList({ movies, onRate, onReset, totalCount }) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("date"); // 'date' | 'rating'

  const sorted = useMemo(() => {
    const list = [...movies];
    if (sortBy === "rating") {
      list.sort((a, b) => {
        const ar = a.rating ?? -1;
        const br = b.rating ?? -1;
        if (br !== ar) return br - ar;
        return new Date(b.watchedAt) - new Date(a.watchedAt);
      });
    } else {
      list.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    }
    return list;
  }, [movies, sortBy]);

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-violet-800/40 bg-surface2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-3">
          <span className="font-display text-lg text-bone">Watched & tracked</span>
          <span className="rounded-full bg-violet-700/40 px-2.5 py-0.5 font-mono text-xs text-violet-200">
            {movies.length} / {totalCount}
          </span>
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className={`text-violet-300 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M4 7l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-violet-800/30 px-6 py-5">
          {movies.length === 0 ? (
            <p className="py-6 text-center text-violet-300/60">
              Nothing here yet — spin the wheel to start your list.
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-end gap-2">
                <span className="font-mono text-xs uppercase tracking-wide text-violet-300/60">
                  Sort by
                </span>
                <div className="flex rounded-full bg-ink/60 p-1">
                  <SortButton
                    active={sortBy === "date"}
                    onClick={() => setSortBy("date")}
                    label="Recent"
                  />
                  <SortButton
                    active={sortBy === "rating"}
                    onClick={() => setSortBy("rating")}
                    label="Top rated"
                  />
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {sorted.map((movie) => (
                  <li
                    key={movie.id}
                    className="flex items-center gap-4 rounded-xl bg-ink/40 p-3"
                  >
                    <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-md bg-violet-900">
                      {movie.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={movie.posterUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-bone">
                        {movie.title}{" "}
                        <span className="text-violet-300/50">({movie.year})</span>
                      </p>
                      <div className="mt-1.5">
                        <StarRating
                          value={movie.rating}
                          onChange={(v) => onRate(movie.id, v)}
                          size={18}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => onReset(movie.id)}
                      title="Put back on the wheel"
                      className="flex-shrink-0 rounded-full p-2 text-violet-300/50 transition-colors hover:bg-violet-800/30 hover:text-violet-200"
                      aria-label={`Put ${movie.title} back on the wheel`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M2 8a6 6 0 1 1 1.76 4.24M2 8V4M2 8h4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SortButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-violet-500 text-ink" : "text-violet-300/70 hover:text-violet-200"
      }`}
    >
      {label}
    </button>
  );
}
