-- 學校打卡地理範圍
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(9,6);
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(9,6);
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "checkInRadius" INTEGER;

-- 手機驗證碼
CREATE TABLE IF NOT EXISTS "VerificationCode" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "VerificationCode_phone_idx" ON "VerificationCode"("phone");
