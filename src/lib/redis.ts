import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
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
