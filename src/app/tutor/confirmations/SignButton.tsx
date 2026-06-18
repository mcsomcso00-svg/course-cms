"use client";

import { useRef, useState } from "react";
import { signJob } from "./actions";

export default function SignButton({ jcId }: { jcId: string }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasDrawing(true);
  }
  function up() {
    drawing.current = false;
  }
  function clear() {
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasDrawing(false);
  }
  function close() {
    setOpen(false);
    setErr(null);
    setAgreed(false);
    setHasDrawing(false);
  }

  async function submit() {
    setErr(null);
    if (!agreed) return setErr("請先勾選同意聲明");
    if (!hasDrawing) return setErr("請先簽名");
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    setBusy(true);
    const res = await signJob(jcId, dataUrl, agreed);
    setBusy(false);
    if (res.ok) close();
    else setErr(res.message ?? "簽署失敗");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        簽署
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="mb-3 font-semibold">請在以下方框簽署</h3>
            <canvas
              ref={canvasRef}
              width={320}
              height={160}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerLeave={up}
              className="w-full touch-none rounded-lg border border-gray-300 bg-[#fff]"
              style={{ touchAction: "none" }}
            />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="accent-black"
              />
              本人同意接任以上工作安排
            </label>
            {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
            <div className="mt-4 flex justify-between gap-2">
              <button
                onClick={close}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                取消
              </button>
              <button
                onClick={clear}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              >
                重設
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {busy ? "提交中…" : "提交"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
