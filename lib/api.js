// lib/api.js
// Thin client for our own Next.js API routes (app/api/movies/...), which talk
// to Postgres/Neon via Prisma. Same-origin, so no base URL needed.
//
// Source-keyed reads live under /api/movies/by-source/:source/... and
// id-keyed mutations live under /api/movies/:id/... — they're nested this
// way (rather than as siblings) because Next.js doesn't allow two different
// dynamic segment names ([source] vs [id]) at the same level of the route tree.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getAll: (source) => request(`/api/movies/by-source/${source}`),
  getWheel: (source) => request(`/api/movies/by-source/${source}/wheel`),
  getWatched: (source, sort = "date") =>
    request(`/api/movies/by-source/${source}/watched?sort=${sort}`),
  markWatched: (id) => request(`/api/movies/${id}/watch`, { method: "PATCH" }),
  rate: (id, rating) =>
    request(`/api/movies/${id}/rate`, {
      method: "PATCH",
      body: JSON.stringify({ rating }),
    }),
  reset: (id) => request(`/api/movies/${id}/reset`, { method: "PATCH" }),
};

export const SOURCES = [
  {
    key: "imdb",
    name: "IMDb",
    tagline: "Crowd-rated classics & blockbusters",
    accent: "from-violet-600 to-violet-800",
  },
  {
    key: "letterboxd",
    name: "Letterboxd",
    tagline: "Cinephile favorites & arthouse darlings",
    accent: "from-violet-500 to-violet-700",
  },
  {
    key: "metacritic",
    name: "Metacritic",
    tagline: "Critic-aggregate prestige picks",
    accent: "from-violet-700 to-violet-900",
  },
  {
    key: "rt",
    name: "Rotten Tomatoes",
    tagline: "Certified-fresh consensus",
    accent: "from-violet-600 to-violet-900",
  },
];

export function getSourceMeta(key) {
  return SOURCES.find((s) => s.key === key);
}
