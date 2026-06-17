"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const EARLY_MS = 10 * 60 * 1000; // 須提早 10 分鐘打卡方獲 100%

type Result = { ok: boolean; message?: string };

// Haversine 距離（米）
function distanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function loadLesson(lessonId: string, tutorId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { group: { include: { course: { include: { school: true } } } } },
  });
  if (!lesson) return { error: "找不到課堂" as const };
  if (lesson.tutorId !== tutorId && lesson.substituteTutorId !== tutorId)
    return { error: "你並非此課堂的導師" as const };
  return { lesson };
}

// 驗證是否在學校打卡範圍內（學校未設座標則不限制）
function geofence(
  school: { latitude: unknown; longitude: unknown; checkInRadius: number | null },
  lat: number | null,
  lng: number | null
): Result {
  if (school.latitude == null || school.longitude == null || !school.checkInRadius)
    return { ok: true };
  if (lat == null || lng == null)
    return { ok: false, message: "需要定位權限才能打卡，請開啟位置服務。" };
  const d = distanceM(Number(school.latitude), Number(school.longitude), lat, lng);
  if (d > school.checkInRadius)
    return {
      ok: false,
      message: `不在打卡範圍內（距學校約 ${Math.round(d)} 米，範圍 ${school.checkInRadius} 米）`,
    };
  return { ok: true };
}

export async function checkIn(
  lessonId: string,
  lat: number | null,
  lng: number | null
): Promise<Result> {
  const session = await auth();
  if (!session || session.user.role !== "TUTOR")
    return { ok: false, message: "未登入" };
  const tutorId = session.user.id;

  const res = await loadLesson(lessonId, tutorId);
  if ("error" in res) return { ok: false, message: res.error };
  const { lesson } = res;

  const gf = geofence(lesson.group.course.school, lat, lng);
  if (!gf.ok) return gf;

  const user = await prisma.user.findUnique({ where: { id: tutorId } });
  const now = new Date();
  const payPercent =
    now.getTime() <= lesson.startAt.getTime() - EARLY_MS ? 100 : 30;
  const rate = user?.perLessonRate ? Number(user.perLessonRate) : 0;
  const payAmount = (rate * payPercent) / 100;

  await prisma.checkIn.upsert({
    where: { lessonId_tutorId: { lessonId, tutorId } },
    update: {},
    create: {
      lessonId,
      tutorId,
      checkInAt: now,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      payPercent,
      payAmount,
    },
  });

  revalidatePath("/tutor");
  revalidatePath("/tutor/pay");
  return { ok: true, message: `已到達打卡（${payPercent}%）` };
}

export async function checkOut(
  lessonId: string,
  lat: number | null,
  lng: number | null
): Promise<Result> {
  const session = await auth();
  if (!session || session.user.role !== "TUTOR")
    return { ok: false, message: "未登入" };
  const tutorId = session.user.id;

  const res = await loadLesson(lessonId, tutorId);
  if ("error" in res) return { ok: false, message: res.error };

  const gf = geofence(res.lesson.group.course.school, lat, lng);
  if (!gf.ok) return gf;

  await prisma.checkIn.update({
    where: { lessonId_tutorId: { lessonId, tutorId } },
    data: { checkOutAt: new Date() },
  });

  revalidatePath("/tutor");
  return { ok: true, message: "已離開打卡" };
}
