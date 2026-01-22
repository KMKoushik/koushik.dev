import { redis } from "./redis";

// Redis key prefix for envshare secrets
export const ENVSHARE_PREFIX = "envshare:";

export interface EnvShareSecret {
  encrypted: string; // Base64 encoded encrypted content
  iv: string; // Base64 encoded initialization vector
  reads: number; // Remaining reads (-1 for unlimited)
  createdAt: number;
  expiresAt: number;
}

export interface CreateSecretRequest {
  encrypted: string;
  iv: string;
  ttl: number; // TTL in seconds
  reads: number; // -1 for unlimited
}

export interface CreateSecretResponse {
  id: string;
}

export interface GetSecretResponse {
  encrypted: string;
  iv: string;
  reads: number;
  expiresAt: number;
}

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

// TTL options in seconds
export const TTL_OPTIONS = [
  { label: "1 hour", value: 60 * 60 },
  { label: "1 day", value: 60 * 60 * 24 },
  { label: "7 days", value: 60 * 60 * 24 * 7 },
  { label: "30 days", value: 60 * 60 * 24 * 30 },
] as const;

// Read limit options (-1 for unlimited)
export const READ_OPTIONS = [
  { label: "1 read", value: 1 },
  { label: "5 reads", value: 5 },
  { label: "10 reads", value: 10 },
  { label: "Unlimited", value: -1 },
] as const;
