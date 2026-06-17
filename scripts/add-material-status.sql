-- 課堂物資狀態（4 態）
DO $$ BEGIN
  CREATE TYPE "MaterialPrepStatus" AS ENUM ('NO_CONTENT','NO_MATERIAL','NOT_SENT_SCHOOL','DONE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "Lesson"
  ADD COLUMN IF NOT EXISTS "materialStatus" "MaterialPrepStatus" NOT NULL DEFAULT 'NO_CONTENT';
