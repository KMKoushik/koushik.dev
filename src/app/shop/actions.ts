"use server";

import { revalidatePath } from "next/cache";
import { redis, SHOP_ITEMS_KEY, SHOP_SUGGESTIONS_KEY, type ShopItem } from "~/lib/redis";

export async function getItems(): Promise<ShopItem[]> {
  const items = await redis.hgetall<Record<string, ShopItem>>(SHOP_ITEMS_KEY);

  if (!items) return [];

  return Object.values(items).sort((a, b) => {
    // Uncompleted items first, then by creation date (oldest first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.createdAt - b.createdAt;
  });
}

export async function addItem(formData: FormData): Promise<void> {
  const name = formData.get("item") as string;
  const quantityStr = formData.get("quantity") as string;

  if (!name?.trim()) return;

  const quantity = quantityStr ? parseInt(quantityStr, 10) : undefined;
  const id = crypto.randomUUID();

  const item: ShopItem = {
    id,
    name: name.trim(),
    quantity: quantity && !isNaN(quantity) ? quantity : undefined,
    completed: false,
    createdAt: Date.now(),
  };

  await redis.hset(SHOP_ITEMS_KEY, { [id]: item });
  
  // Store suggestion (using set to avoid duplicates)
  await redis.sadd(SHOP_SUGGESTIONS_KEY, name.trim().toLowerCase());
  
  revalidatePath("/shop");
}

export async function toggleItem(id: string): Promise<void> {
  const item = await redis.hget<ShopItem>(SHOP_ITEMS_KEY, id);

  if (!item) return;

  const updatedItem: ShopItem = {
    ...item,
    completed: !item.completed,
  };

  await redis.hset(SHOP_ITEMS_KEY, { [id]: updatedItem });
  revalidatePath("/shop");
}

export async function deleteItem(id: string): Promise<void> {
  await redis.hdel(SHOP_ITEMS_KEY, id);
  revalidatePath("/shop");
}

export async function clearCompleted(): Promise<void> {
  const items = await redis.hgetall<Record<string, ShopItem>>(SHOP_ITEMS_KEY);

  if (!items) return;

  const completedIds = Object.entries(items)
    .filter(([, item]) => item.completed)
    .map(([id]) => id);

  if (completedIds.length > 0) {
    await redis.hdel(SHOP_ITEMS_KEY, ...completedIds);
  }

  revalidatePath("/shop");
}

export async function getSuggestions(): Promise<string[]> {
  const suggestions = await redis.smembers(SHOP_SUGGESTIONS_KEY);
  return suggestions || [];
}
