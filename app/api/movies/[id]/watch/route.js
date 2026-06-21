import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { id } = params;
  try {
    const movie = await prisma.movie.update({
      where: { id },
      data: { status: "watched", watchedAt: new Date() },
    });
    return NextResponse.json(movie);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
