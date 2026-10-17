import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  if (
    process.env.NEXT_PUBLIC_ENABLE_TRIP_PLANNER !== "true" &&
    request.nextUrl.pathname.startsWith("/plan")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/plan", "/plan/:path*"],
};
