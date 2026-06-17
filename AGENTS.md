<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Course CMS (導師課程管理系統)

Internal CMS for a HK tutoring operation. UI language: Traditional Chinese (繁體中文). Tutor-facing pages must be mobile-friendly (tutors use phones for 打卡 and signing); admin pages are desktop-first.

## Features

1. **Job confirmation (導師工作確認)** — admin generates a PDF, tutor e-signs it in the CMS (signature pad), signed PDF stored and downloadable.
2. **Schools & courses** — CRUD for schools, courses, lessons (班); update class status and dates.
3. **Tutor / substitute (代課)** — each lesson has an assigned tutor; a substitute can be set when the tutor is on leave.
4. **Check-in (打卡)** — tutor presses a button on their phone; timestamp + GPS recorded.
5. **Materials (課程物料)** — per-course material items with status 未準備 / 準備中 / 已準備.

## Payroll rules (出糧) — do not change without user approval

- Pay is a fixed amount **per lesson**, from `User.perLessonRate` (HKD).
- Check-in **≥ 10 minutes before** `Lesson.startAt` → 100% pay.
- Later than that → **70% deducted, tutor receives 30%**.
- A 代課 (substitute) tutor is paid at **their own** `perLessonRate`, not the original tutor's.
- `CheckIn.payAmount` is snapshotted at check-in time so later rate changes don't affect history.

## Stack & commands

- Next.js (App Router, TypeScript, Tailwind, src dir) + Prisma 6 (**do not upgrade to Prisma 7** — schema uses the v6 datasource format) + **Supabase** (hosted PostgreSQL; planned: Supabase Storage for signed PDFs/signature images).
- DB connections in `.env`: `DATABASE_URL` = Supabase transaction pooler (port 6543, `?pgbouncer=true`), `DIRECT_URL` = direct connection (port 5432, used by Prisma Migrate).
- Offline fallback: local PostgreSQL via `docker compose up -d` (container `course-cms-db`); swap the commented lines in `.env`.
- Migrate: `npx prisma migrate dev` · Generate client: `npx prisma generate`
- Dev server: `npm run dev`
- Prisma client singleton: `src/lib/prisma.ts`
