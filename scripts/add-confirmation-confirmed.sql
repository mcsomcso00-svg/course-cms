-- 工作確認書新增「已確認」狀態
ALTER TYPE "ConfirmationStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
