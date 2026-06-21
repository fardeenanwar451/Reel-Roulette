import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { rating } = body;
  const isValid =
    rating === null ||
    (typeof rating === "number" &&
      rating >= 0 &&
      rating <= 5 &&
      Math.round(rating * 2) === rating * 2);

  if (!isValid) {
    return NextResponse.json(
      { error: "rating must be null or a number 0-5 in 0.5 steps" },
      { status: 400 }
    );
  }

  try {
    const movie = await prisma.movie.update({
      where: { id },
      data: { rating },
    });
    return NextResponse.json(movie);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
