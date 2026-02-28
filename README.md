# SubTrack

Репозиторий переведен на `npm workspaces` и теперь содержит основу новой архитектуры:

- `server/` - Express + TypeScript backend foundation
- `client/` - React + Vite + TanStack + Zustand frontend foundation
- корневой Next.js код пока остается как legacy runtime (`legacy:*` scripts)

## Быстрый старт

```bash
npm install
npm run dev
```

`npm run dev` запускает одновременно `server` и `client`.

## Полезные скрипты

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run legacy:dev`
- `npm run legacy:build`
- `npm run legacy:start`

## Backend health

После запуска backend доступен endpoint:

- `GET http://localhost:4000/api/health`

## Переменные окружения

Для backend используйте `server/.env.example` как шаблон.
