"use client";

import { useActionState, useState, useTransition } from "react";
import { sendOtp, loginOtp } from "./actions";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export default function TutorLoginPage() {
  const [phone, setPhone] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sending, startSend] = useTransition();
  const [error, formAction, pending] = useActionState(loginOtp, undefined);

  function send() {
    setSendMsg(null);
    setDevCode(null);
    startSend(async () => {
      const r = await sendOtp(phone);
      setSendMsg(r.message);
      if (r.devCode) setDevCode(r.devCode);
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-5">
      <div className="mb-8 text-center">
        <div className="text-2xl font-black tracking-wide">STARDIAN</div>
        <div className="text-sm tracking-[0.3em] text-gray-500">星佑教育</div>
        <h1 className="mt-3 text-xl font-bold">打卡系統</h1>
      </div>

      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">手機號碼區號</label>
          <input value="852" readOnly className={inputCls + " bg-gray-50"} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">手機號碼</label>
          <input
            name="phone"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">驗證碼</label>
          <input name="code" inputMode="numeric" className={inputCls} />
        </div>

        {sendMsg && (
          <p className="text-sm text-gray-600">
            {sendMsg}
            {devCode && (
              <span className="ml-1 font-semibold text-black">：{devCode}</span>
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={send}
            disabled={sending || !phone}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {sending ? "發送中…" : "發送驗證碼"}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? "登入中…" : "登入"}
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400">
          電話號碼須已登記於系統的導師資料中
        </p>
      </form>
    </main>
  );
}
