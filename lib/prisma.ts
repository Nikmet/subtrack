import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/app/generated/prisma/client";

const connectionString =
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL ??
    "postgresql://subtrack:subtrack@localhost:5432/subtrack";

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
    pgPool?: Pool;
};

const pool =
    globalForPrisma.pgPool ??
    new Pool({
        connectionString,
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
