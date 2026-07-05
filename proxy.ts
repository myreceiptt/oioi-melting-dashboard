import { NextRequest, NextResponse } from "next/server";
import { getMintSurfaceByHost } from "./lib/app/surfaceRoutes";

export function proxy(request: NextRequest) {
  const mintSurface = getMintSurfaceByHost(request.headers.get("host"));
  const pathname = request.nextUrl.pathname;

  if (!mintSurface) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = mintSurface.pathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - Next.js internals
     * - static assets
     * - common public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|whitelist).*)",
  ],
};
