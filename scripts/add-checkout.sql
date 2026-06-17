-- 為 CheckIn 加入落堂時間欄位
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "checkOutAt" TIMESTAMP(3);
