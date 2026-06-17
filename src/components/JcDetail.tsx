import type {
  ConfirmationStatus,
  JobConfirmation,
  Lesson,
  Group,
  Course,
  School,
  User,
} from "@prisma/client";

const STATUS: Record<ConfirmationStatus, { label: string; cls: string }> = {
  PENDING: { label: "未簽署", cls: "text-amber-600" },
  SIGNED: { label: "已簽署", cls: "text-emerald-600" },
  CONFIRMED: { label: "已確認", cls: "text-sky-600" },
  VOID: { label: "停用", cls: "text-gray-400" },
};

function hm(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

type JcFull = JobConfirmation & {
  tutor: User;
  course: (Course & { school: School }) | null;
  lessons: (Lesson & { group: Group })[];
};

export default function JcDetail({ jc }: { jc: JcFull }) {
  const st = STATUS[jc.status];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{jc.title}</h2>
          <span className={"text-sm font-medium " + st.cls}>{st.label}</span>
        </div>
        <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
          <Row k="學校" v={jc.course?.school.name} />
          <Row k="課程" v={jc.course?.name} />
          <Row k="導師" v={jc.tutor.name} />
          <Row k="職位" v={jc.position ?? "導師"} />
          <Row
            k="導師費"
            v={jc.tutorFee != null ? `HKD ${Number(jc.tutorFee)}` : null}
          />
          <Row
            k="簽署日期"
            v={
              jc.signedAt
                ? jc.signedAt.toLocaleString("zh-HK", {
                    timeZone: "Asia/Hong_Kong",
                  })
                : null
            }
          />
        </dl>
        {jc.otherAgreement && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            其他協議：{jc.otherAgreement}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-500">課堂</h3>
        {jc.lessons.length === 0 ? (
          <p className="text-sm text-gray-400">未連結課堂。</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {jc.lessons.map((l) => (
              <li key={l.id} className="text-gray-700">
                {l.date.toISOString().slice(0, 10)}（{l.group.name}）{" "}
                {hm(l.startAt)}-{hm(l.endAt)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-500">導師簽署</h3>
        {jc.signatureData ? (
          <>
            {jc.agreed && (
              <p className="mb-2 text-xs text-emerald-700">
                ✓ 已同意接任以上工作安排
              </p>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={jc.signatureData}
              alt="簽名"
              className="h-24 rounded-lg border border-gray-200 bg-white"
            />
          </>
        ) : (
          <p className="text-sm text-gray-400">尚未簽署。</p>
        )}
      </div>

      <a
        href={`/api/jc/${jc.id}/pdf`}
        className="inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        下載 PDF
      </a>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-gray-400">{k}：</dt>
      <dd className="text-gray-900">{v || "—"}</dd>
    </div>
  );
}
