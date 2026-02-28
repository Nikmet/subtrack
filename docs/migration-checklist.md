# Migration Checklist

## Completed in this pass

- [x] Phase A.1: Created `server/` and `client/` as npm workspaces.
- [x] Phase A.3: Added root `.editorconfig` and shared TS base config.
- [x] Phase A.4: Added root orchestration scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- [x] Phase B.1: Express app with `/api/health`.
- [x] Phase B.2: Added `helmet`, request-id middleware, `pino` logging, centralized error handler.
- [x] Phase B.3: Copied Prisma schema/migrations to `server/prisma` and wired `server/src/lib/prisma.ts`.
- [x] Phase B.4: Implemented JWT issue/verify + cookie config foundation.
- [x] Phase B.5: Added `requireAuth`, `requireAdmin`, `validateBody(zod)` middleware.
- [x] Phase D foundation: Vite + React + TanStack Router/Query/Form + Zustand skeleton.
- [x] Phase F.1 prep: Added sample nginx reverse proxy config (`infra/nginx/subtrack.conf`).

## Next steps

- [ ] Phase A.2: Move current Next runtime into explicit `legacy/` package.
- [ ] Phase C: Migrate domain APIs from Next server actions into `server/src/modules`.
- [ ] Phase E: Move UI screens block-by-block with visual parity.
- [ ] Phase F.2-F.4: Introduce routing feature flags (`USE_NEW_CLIENT`, `USE_NEW_API`) and rollback toggle.
- [ ] Phase G: Remove legacy runtime after stable cutover.
