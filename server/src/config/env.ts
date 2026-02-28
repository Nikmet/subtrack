const DEFAULT_PORT = 4000;
const DEFAULT_DB_URL = "postgresql://subtrack:subtrack@localhost:5432/subtrack";

function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseIntEnv(process.env.PORT, DEFAULT_PORT),
  databaseUrl:
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DB_DATABASE_URL ??
    DEFAULT_DB_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
  accessTokenTtlMs: parseIntEnv(process.env.JWT_ACCESS_TTL_MS, 15 * 60 * 1000),
  refreshTokenTtlMs: parseIntEnv(
    process.env.JWT_REFRESH_TTL_MS,
    7 * 24 * 60 * 60 * 1000,
  ),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
