import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 快速 session cookie 檢查作重定向；真正身份及角色驗證在各 layout 以 auth() 執行。
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = pathname.startsWith("/tutor") ? "/tutor-login" : "/login";
    return NextResponse.redirect(new URL(url, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tutor/:path*"],
};
