// lib/prisma.js
// Singleton Prisma client. In Next.js dev mode, modules can be re-evaluated
// on every hot reload — without this guard you'd open a new DB connection
// pool on every save, which exhausts Neon's connection limit fast.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
