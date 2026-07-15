# Repository Guidelines for AI Agents

## Project Structure & Module Organization
This is a Vite + React + TypeScript app. Entry starts at `src/main.tsx` and mounts `src/app/App.tsx`. Keep product code under `src/app/`: `features/` for route-level domains, `routes/` for router setup, `providers/` for app state, `shell/` for layout, and `shared/` for reusable domain UI/data/types. Current feature areas include `auth`, `areas`, `dashboard`, `invoices`, `settings`, and `subscribers`. shadcn support folders and small reusable hooks live in `src/hooks/` and `src/lib/`. Shared primitives are in `src/app/components/ui/`. Global styling stays in `src/styles/`.

## Build, Test, and Development Commands
Use `npm`.

- `npm install`: install and sync dependencies.
- `npm run dev`: run the local Vite server.
- `npm run build`: create the production bundle in `dist/`.
- `npm run preview`: serve the built app locally.
- `npm run typecheck`: run TypeScript checks.
- `npm run lint`: run ESLint across the repo.

## Coding Style & Naming Conventions
Favor feature-first structure over large page files. Put route-specific UI inside that feature's `components/` folder; move cross-feature pieces into `shared/`.

- Use `PascalCase` for components, pages, and providers.
- Use `camelCase` for variables, functions, and props.
- Use descriptive filenames such as `SettingsPage.tsx`, `SettingsProvider.tsx`, and `subscriberColumns.tsx`.

Prefer functional React components, explicit local types, and route-driven navigation with `react-router-dom`. TanStack Table is used for subscribers, while the areas screen uses query-backed card lists and sheet/dialog CRUD flows.

## Testing Guidelines
There is no dedicated automated test suite yet. Before opening a PR, run `pnpm lint`, `pnpm typecheck`, and `pnpm build`, then verify the main routes in `pnpm dev`: `/login`, `/dashboard`, `/areas`, `/subscribers`, `/invoices`, and `/settings`. If tests are added later, place them near the feature they cover and use `*.test.tsx`.

## Configuration Notes
Keep Vite, Tailwind, and shadcn aliases aligned across `vite.config.ts`, `tsconfig.json`, and `components.json`. The settings UI mirrors the mobile product, but only pricing, language, trigger date, and trigger message currently map to the backend `CompanyPreferences` contract; notification toggles are still web-local.
