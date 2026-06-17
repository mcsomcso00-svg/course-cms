-- 小組支援多個上課星期 + 預算欄位
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "daysOfWeek" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "budget" TEXT;

-- 將舊有單一 dayOfWeek 遷移至 daysOfWeek
UPDATE "Group"
SET "daysOfWeek" = ARRAY["dayOfWeek"]
WHERE "dayOfWeek" IS NOT NULL AND "daysOfWeek" = '{}';
