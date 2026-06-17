-- 工作確認書新增欄位
ALTER TABLE "JobConfirmation" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "JobConfirmation" ADD COLUMN IF NOT EXISTS "tutorFee" DECIMAL(10,2);
ALTER TABLE "JobConfirmation" ADD COLUMN IF NOT EXISTS "otherAgreement" TEXT;
ALTER TABLE "JobConfirmation" ADD COLUMN IF NOT EXISTS "signatureData" TEXT;
ALTER TABLE "JobConfirmation" ADD COLUMN IF NOT EXISTS "agreed" BOOLEAN NOT NULL DEFAULT false;

-- JobConfirmation ↔ Lesson 多對多（Prisma 隱式關聯表）
CREATE TABLE IF NOT EXISTS "_JobConfirmationToLesson" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_JobConfirmationToLesson_AB_unique" ON "_JobConfirmationToLesson"("A","B");
CREATE INDEX IF NOT EXISTS "_JobConfirmationToLesson_B_index" ON "_JobConfirmationToLesson"("B");

DO $$ BEGIN
  ALTER TABLE "_JobConfirmationToLesson"
    ADD CONSTRAINT "_JobConfirmationToLesson_A_fkey"
    FOREIGN KEY ("A") REFERENCES "JobConfirmation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "_JobConfirmationToLesson"
    ADD CONSTRAINT "_JobConfirmationToLesson_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
