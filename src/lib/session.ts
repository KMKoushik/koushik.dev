import { cookies } from "next/headers";

const COOKIE_NAME = "shop_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

async function createHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return Buffer.from(signature).toString("hex");
}

export async function createSession(): Promise<string> {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) throw new Error("INTERNAL_SECRET is not configured");
  const timestamp = Date.now().toString();
  const hash = await createHmac(timestamp, secret);
  return Buffer.from(`${timestamp}:${hash}`).toString("base64");
}

// Note: This verification logic is duplicated in middleware.ts because
// middleware runs in Edge Runtime with different import constraints.
// Keep both in sync if changing the session format.
export async function verifySession(token: string): Promise<boolean> {
  try {
    const secret = process.env.INTERNAL_SECRET;
    if (!secret) return false;
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [timestamp, hash] = decoded.split(":");

    if (!timestamp || !hash) return false;

    const expectedHash = await createHmac(timestamp, secret);

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

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION / 1000, // in seconds
    path: "/",
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function verifyPassword(password: string): boolean {
  const correctPassword = process.env.INTERNAL_PASSWORD;
  if (!correctPassword) return false;
  return password === correctPassword;
}
