"use client";

import { useState } from "react";
import { checkIn, checkOut } from "./actions";

type Props = {
  lessonId: string;
  schoolName: string;
  courseName: string;
  groupName: string;
  role: string;
  timeLabel: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  payPercent: number | null;
};

function getPosition(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export default function CheckInCard(p: Props) {
  const [busy, setBusy] = useState<"in" | "out" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(kind: "in" | "out") {
    setBusy(kind);
    setMsg(null);
    const { lat, lng } = await getPosition();
    const res =
      kind === "in"
        ? await checkIn(p.lessonId, lat, lng)
        : await checkOut(p.lessonId, lat, lng);
    setBusy(null);
    if (res?.message) setMsg({ ok: !!res.ok, text: res.message });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
      <div className="font-semibold">{p.schoolName}</div>
      <div className="text-sm text-gray-500">
        {p.role}
      </div>
      <div className="text-sm text-gray-700">
        {p.courseName}（{p.groupName}）
      </div>
      <div className="mt-0.5 text-sm text-gray-700">{p.timeLabel}</div>

      <div className="mt-3 flex justify-center gap-2">
        <button
          onClick={() => act("in")}
          disabled={busy !== null || !!p.checkedInAt}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40"
        >
          {busy === "in" ? "處理中…" : "到達打卡"}
        </button>
        <button
          onClick={() => act("out")}
          disabled={busy !== null || !p.checkedInAt || !!p.checkedOutAt}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40"
        >
          {busy === "out" ? "處理中…" : "離開打卡"}
        </button>
      </div>

      {(p.checkedInAt || p.checkedOutAt) && (
        <div className="mt-2 text-xs text-gray-500">
          {p.checkedInAt && (
            <span className="mr-3">
              到達 {p.checkedInAt}
              {p.payPercent != null && (
                <span className="ml-1 text-emerald-600">{p.payPercent}%</span>
              )}
            </span>
          )}
          {p.checkedOutAt && <span>離開 {p.checkedOutAt}</span>}
        </div>
      )}

      {msg && (
        <p
          className={
            "mt-2 text-xs " + (msg.ok ? "text-emerald-600" : "text-rose-600")
          }
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
