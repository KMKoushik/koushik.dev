export interface EnvShareSecret {
  encrypted: string;
  iv: string;
  reads: number;
  createdAt: number;
  expiresAt: number;
}

export interface CreateSecretRequest {
  encrypted: string;
  iv: string;
  ttl: number;
  reads: number;
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

export const TTL_OPTIONS = [
  { label: "1 hour", value: 60 * 60 },
  { label: "1 day", value: 60 * 60 * 24 },
  { label: "7 days", value: 60 * 60 * 24 * 7 },
  { label: "30 days", value: 60 * 60 * 24 * 30 },
] as const;

export const READ_OPTIONS = [
  { label: "1 read", value: 1 },
  { label: "5 reads", value: 5 },
  { label: "10 reads", value: 10 },
  { label: "Unlimited", value: -1 },
] as const;
