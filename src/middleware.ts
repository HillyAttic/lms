import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /Admin/* → /admin/* (case-insensitive admin routes)
  if (pathname.startsWith("/Admin/") || pathname === "/Admin") {
    const newPath = pathname.replace(/^\/Admin/, "/admin");
    return NextResponse.redirect(new URL(newPath, request.url));
  }
}

export const config = {
  matcher: ["/Admin/:path*", "/Admin"],
};
