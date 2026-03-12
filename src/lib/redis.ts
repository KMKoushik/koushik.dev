import "server-only";
import { Redis } from "@upstash/redis";

const url = process.env.STORAGE_KV_REST_API_URL ?? process.env.KV_REST_API_URL;
const token =
  process.env.STORAGE_KV_REST_API_TOKEN ?? process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error(
    "Missing KV configuration: set STORAGE_KV_REST_API_URL and STORAGE_KV_REST_API_TOKEN"
  );
}

export const redis = new Redis({
  url,
  token,
});

export const SHOP_ITEMS_KEY = "shop:items";
export const SHOP_SUGGESTIONS_KEY = "shop:suggestions";

export interface ShopItem {
  id: string;
  name: string;
  quantity?: number;
  completed: boolean;
  createdAt: number;
}
