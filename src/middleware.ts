import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "shop_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

// Note: This verification logic is duplicated from lib/session.ts because
// middleware runs in Edge Runtime with different import constraints.
// Keep both in sync if changing the session format.
async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.INTERNAL_SECRET;
    if (!secret) return false;

    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [timestamp, hash] = decoded.split(":");

    if (!timestamp || !hash) return false;

    // Recreate HMAC to verify
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(timestamp);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const expectedHash = Buffer.from(signature).toString("hex");

    // Use timing-safe comparison to prevent timing attacks
    const hashBuffer = Buffer.from(hash, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");
    if (hashBuffer.length !== expectedBuffer.length) return false;

    // Compare byte by byte in constant time
    let mismatch = 0;
    for (let i = 0; i < hashBuffer.length; i++) {
      mismatch |= hashBuffer[i] ^ expectedBuffer[i];
    }
    if (mismatch !== 0) return false;

    // Check if session has expired
    const sessionTime = parseInt(timestamp, 10);
    if (Date.now() - sessionTime > SESSION_DURATION) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = new URL(request.url);

  // Handle /shop routes - protect them with session auth
  if (pathname.startsWith("/shop")) {
    // Allow access to login page and auth API
    if (pathname === "/shop/login" || pathname.startsWith("/api/shop/auth")) {
      return NextResponse.next();
    }

    // Check for valid session cookie
    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/shop/login", request.url));
    }

    const isValid = await verifySessionToken(sessionCookie);
    if (!isValid) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL("/shop/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.next();
  }

  // Handle terminal client detection for root path
  if (pathname === "/") {
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
    const acceptHeader = (request.headers.get("accept") || "").toLowerCase();

    const isTerminalClient =
      /curl|httpie|wget/.test(userAgent) || acceptHeader.includes("text/plain");

    if (isTerminalClient) {
      const url = new URL("/cli", request.url);
      // Preserve query string parameters
      url.search = search;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/shop/:path*"],
};
