"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    login,
    undefined
  );

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">課程管理系統</h1>
        <p className="mb-6 text-sm text-gray-500">請登入以繼續</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              電郵
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              密碼
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-black py-2.5 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? "登入中…" : "登入"}
          </button>
        </form>
      </div>
    </main>
  );
}
