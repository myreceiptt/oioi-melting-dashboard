import { NextRequest, NextResponse } from "next/server";

const hostRouteMap: Record<string, string> = {
  "rotybase.endhonesa.com": "/mint/roty/base",
  "rotydeth.endhonesa.com": "/mint/roty/ethereum",
  "meltingbase.endhonesa.com": "/mint/melting/base",
  "meltingdeth.endhonesa.com": "/mint/melting/ethereum",
  "amandabase.endhonesa.com": "/mint/amanda/base",
  "amandadeth.endhonesa.com": "/mint/amanda/ethereum",
};

function normalizeHost(host: string | null) {
  if (!host) {
    return "";
  }

  return host
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/:\d+$/, "");
}

export function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"));
  const pathname = request.nextUrl.pathname;
  const targetPath = hostRouteMap[host];

  if (!targetPath) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
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
