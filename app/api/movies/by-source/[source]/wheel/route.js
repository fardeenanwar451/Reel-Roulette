import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_SOURCES = ["imdb", "letterboxd", "metacritic", "rt"];

export async function GET(request, { params }) {
  const { source } = params;
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json({ error: `Unknown source "${source}"` }, { status: 400 });
  }

  try {
    const movies = await prisma.movie.findMany({
      where: { source, status: "wheel" },
      orderBy: { rank: "asc" },
    });
    return NextResponse.json(movies);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
