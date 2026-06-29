import { NextResponse, type NextRequest } from "next/server";

// CSRF 방어(전역): 쿠키 인증 mutating 요청(POST/PUT/PATCH/DELETE)의 Origin이
// 호스트와 다르면 차단. sameSite=lax 쿠키와 조합되는 다층 방어.
// 헤드리스 REST(/api/wp/*)는 Bearer 토큰 인증이라 CSRF 대상이 아니므로 예외.
export function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/wp/")) return NextResponse.next();

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return new NextResponse("Forbidden: cross-origin request blocked", { status: 403 });
      }
    } catch {
      return new NextResponse("Forbidden: invalid origin", { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"]
};
