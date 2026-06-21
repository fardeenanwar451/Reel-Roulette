"use client";

export default function ResultReveal({ movie, onClose, onRateNow }) {
  if (!movie) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm animate-pop-in"
      role="dialog"
      aria-modal="true"
      aria-label="Your selected movie"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-400/30 bg-surface2 shadow-glow">
        {movie.backdropUrl && (
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url(${movie.backdropUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface2 via-surface2/90 to-surface2/40" />

        <div className="relative flex flex-col items-center px-8 py-10 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
            Tonight you&rsquo;re watching
          </span>

          <div className="mt-6 h-56 w-36 overflow-hidden rounded-xl shadow-card">
            {movie.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-violet-900 text-sm text-violet-200">
                {movie.title}
              </div>
            )}
          </div>

          <h2 className="mt-6 font-display text-3xl text-bone text-balance">
            {movie.title}
          </h2>
          <p className="mt-1 text-violet-300/70">
            {movie.year} {movie.runtime ? `· ${movie.runtime} min` : ""}
          </p>
          {movie.genres?.length > 0 && (
            <p className="mt-2 text-sm text-violet-200/60">{movie.genres.join(" · ")}</p>
          )}
          {movie.overview && (
            <p className="mt-4 max-h-24 overflow-y-auto text-sm leading-relaxed text-violet-100/70">
              {movie.overview}
            </p>
          )}

          <div className="mt-8 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-violet-400/40 px-5 py-3 font-medium text-violet-200 transition-colors hover:bg-violet-800/30"
            >
              Spin again later
            </button>
            <button
              onClick={onRateNow}
              className="flex-1 rounded-full bg-violet-500 px-5 py-3 font-medium text-ink transition-colors hover:bg-violet-400"
            >
              Rate it now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
