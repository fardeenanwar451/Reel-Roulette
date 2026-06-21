import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_SOURCES = ["imdb", "letterboxd", "metacritic", "rt"];

export async function GET(request, { params }) {
  const { source } = params;
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json({ error: `Unknown source "${source}"` }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get("sort");

  // Prisma sorts NULLs first by default on desc rating sort; we want unrated
  // movies to sink to the bottom, same behavior as the original Mongoose version.
  const orderBy =
    sortParam === "rating"
      ? [{ rating: { sort: "desc", nulls: "last" } }, { watchedAt: "desc" }]
      : [{ watchedAt: "desc" }];

  try {
    const movies = await prisma.movie.findMany({
      where: { source, status: "watched" },
      orderBy,
    });
    return NextResponse.json(movies);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
