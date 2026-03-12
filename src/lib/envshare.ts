import "server-only";

import { redis } from "./redis";
import type { EnvShareSecret } from "./envshare-shared";

// Redis key prefix for envshare secrets
export const ENVSHARE_PREFIX = "envshare:";


// Generate a URL-safe nanoid (12 chars)
export function generateId(): string {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < 12; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}

export async function storeSecret(
  id: string,
  secret: EnvShareSecret,
  ttlSeconds: number
): Promise<void> {
  const key = `${ENVSHARE_PREFIX}${id}`;
  await redis.setex(key, ttlSeconds, JSON.stringify(secret));
}

export async function getSecret(id: string): Promise<EnvShareSecret | null> {
  const key = `${ENVSHARE_PREFIX}${id}`;
  const data = await redis.get<string>(key);
  if (!data) return null;

  // Handle both string and object responses from Redis
  if (typeof data === "string") {
    return JSON.parse(data) as EnvShareSecret;
  }
  return data as unknown as EnvShareSecret;
}

export async function decrementReads(id: string): Promise<number | null> {
  const key = `${ENVSHARE_PREFIX}${id}`;
  const secret = await getSecret(id);
  if (!secret) return null;

  // Unlimited reads
  if (secret.reads === -1) {
    return -1;
  }

  const newReads = secret.reads - 1;

  if (newReads <= 0) {
    // Delete the secret if no reads remaining
    await redis.del(key);
    return 0;
  }

  // Update with remaining reads, preserve TTL
  const ttl = await redis.ttl(key);
  if (ttl > 0) {
    secret.reads = newReads;
    await redis.setex(key, ttl, JSON.stringify(secret));
  }

  return newReads;
}

export async function deleteSecret(id: string): Promise<void> {
  const key = `${ENVSHARE_PREFIX}${id}`;
  await redis.del(key);
}
