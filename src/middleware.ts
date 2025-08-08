import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const acceptHeader = (request.headers.get("accept") || "").toLowerCase();

  const isTerminalClient =
    /curl|httpie|wget/.test(userAgent) || acceptHeader.includes("text/plain");

  // Only rewrite the root path to avoid affecting other routes/pages
  const { pathname, search } = new URL(request.url);
  if (pathname === "/" && isTerminalClient) {
    const url = new URL("/cli", request.url);
    // Preserve query string parameters
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
