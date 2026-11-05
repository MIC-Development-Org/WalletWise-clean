# Money Tracker

Personal finance PWA for hostel students (Team G, Microsoft Innovations Club, VIT Chennai). Original spec: `money-tracker-project-plan.md`. User-facing docs: `README.md`.

## Layout (pnpm workspaces)
- `apps/api`: Fastify 5 + Prisma 6 (PostgreSQL). Routes under `/api/v1`.
- `apps/web`: React 19 + Vite + Tailwind 4 + vite-plugin-pwa + Dexie. Static build, no SSR.
- `apps/android`: Capacitor project (`android/` inside it). Kotlin `SmsReaderPlugin`, registered in `MainActivity.java`.
- `packages/shared`: Zod schemas, money helpers, SMS parser and rules, dedupe. Consumed as TypeScript source.
- `infra`: local compose (Postgres), prod compose (api + nginx, DB is RDS), nginx config.

## Commands
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` (all workspaces, CI runs the same).
- `pnpm dev:api`, `pnpm dev:web`. DB: `docker compose -f infra/docker-compose.yml up -d`, then `pnpm --filter @money-tracker/api db:migrate`.
- After editing `schema.prisma` run `pnpm --filter @money-tracker/api db:generate`.
- APK: build web, `pnpm --filter @money-tracker/android sync`, then `./gradlew assembleDebug` in `apps/android/android`.

## Hard rules
- Money is integer paise. Never floats. INR only.
- Times in UTC in the DB.
- Raw SMS text never leaves the phone. Kotlin filters by sender id before JS sees anything. Only extracted fields go to the API. Email bodies are not stored.
- Unparseable captures go to the review list, never dropped or auto-saved.
- Dedupe: reference number match is proof; otherwise a 5 minute window flags POSSIBLE for review. Never silently merge.
- SMS rules are data (`smsRuleSchema`), not code, so banks can be added without an app release. Keep patterns length capped (ReDoS).
- Sync and jobs must be idempotent. Transaction ids are client generated UUIDs; soft delete via `deletedAt`; server `version` resolves conflicts, not device clocks.
- Auth: Argon2id, 15 min JWT, rotating hashed refresh tokens with reuse detection. Validate every input with Zod.
- Secrets only in env or AWS SSM. Never commit `.env`.
- No direct pushes to `main`. PRs need one review and green CI. API contract changes go through `packages/shared` first.
- Do not use em dashes in docs or README. Keep prose plain.

## Platform facts
- iOS cannot read SMS. iPhone gets email capture and scanning. iOS web push needs Add to Home Screen.
- Android 13+ blocks restricted permissions for sideloaded APKs until the user allows them in app settings. Onboarding must explain this.
- Gmail restricted scope stays in test mode for the rollout. Test-mode refresh tokens expire after 7 days, so reconnect prompts are expected.
- Windows shell note: write multi-line files with the Write tool, not bash heredocs.

## Not built yet
Budgets, goals, categories seed data, sync worker, push, Gmail, OCR, SMS live listener, review list UI, shadcn/ui components, API integration tests with a real DB, Terraform. See `docs/` for the owner split.
