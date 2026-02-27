import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Supabase 미설정 시 모든 요청 통과 (localStorage 모드)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  // Supabase 설정 시 세션 관리
  const { updateSession } = await import("@/lib/supabase/middleware");
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더의 파일들
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
