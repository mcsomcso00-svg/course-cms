"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function sendOtp(
  phone: string
): Promise<{ ok: boolean; message: string; devCode?: string }> {
  const p = phone.replace(/\D/g, "");
  if (!p) return { ok: false, message: "請輸入手機號碼" };

  const user = await prisma.user.findFirst({
    where: { phone: p, role: "TUTOR", isActive: true },
  });
  if (!user) return { ok: false, message: "此電話號碼未登記為導師" };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.verificationCode.create({
    data: { phone: p, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  // TODO: 接駁真實 SMS 供應商（Twilio / Vonage 等）。開發模式直接回傳驗證碼於畫面顯示。
  return { ok: true, message: "驗證碼已發送（開發模式）", devCode: code };
}

export async function loginOtp(
  _prev: string | undefined,
  formData: FormData
) {
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const code = String(formData.get("code") ?? "").trim();
  try {
    await signIn("phone-otp", { phone, code, redirectTo: "/tutor" });
  } catch (error) {
    if (error instanceof AuthError) return "驗證碼錯誤或已過期，請重試。";
    throw error;
  }
}
