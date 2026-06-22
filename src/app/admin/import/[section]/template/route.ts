import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSpec } from "@/lib/bulk/specs";
import { buildTemplate } from "@/lib/bulk/excel";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return new NextResponse("Forbidden", { status: 403 });

  const { section } = await params;
  const spec = getSpec(section);
  if (!spec) return new NextResponse("Not found", { status: 404 });

  const buf = await buildTemplate(spec);
  return new NextResponse(buf as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="import-template-${section}.xlsx"`,
    },
  });
}
