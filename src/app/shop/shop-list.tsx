"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ShopItem } from "~/lib/redis";
import { addItem, toggleItem, deleteItem, clearCompleted } from "./actions";

type OptimisticAction =
  | { type: "add"; item: ShopItem }
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "clear_completed" };

function sortItems(items: ShopItem[]): ShopItem[] {
  return [...items].sort((a, b) => {
    // Uncompleted first, then by createdAt (oldest first)
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function itemsReducer(items: ShopItem[], action: OptimisticAction): ShopItem[] {
  switch (action.type) {
    case "add":
      return sortItems([...items, action.item]);
    case "toggle":
      return sortItems(
        items.map((item) =>
          item.id === action.id ? { ...item, completed: !item.completed } : item
        )
      );
    case "delete":
      return items.filter((item) => item.id !== action.id);
    case "clear_completed":
      return items.filter((item) => !item.completed);
    default:
      return items;
  }
}

interface ShopListProps {
  initialItems: ShopItem[];
  suggestions: string[];
}

export default function ShopList({ initialItems, suggestions }: ShopListProps) {
  const [items, addOptimistic] = useOptimistic(initialItems, itemsReducer);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const completedCount = items.filter((item) => item.completed).length;

  function handleAddItem(formData: FormData) {
    const name = formData.get("item") as string;
    const quantityStr = formData.get("quantity") as string;
    if (!name?.trim()) return;

    const quantity = quantityStr ? parseInt(quantityStr, 10) : undefined;

    startTransition(async () => {
      addOptimistic({
        type: "add",
        item: {
          id: `temp-${Date.now()}`,
          name: name.trim(),
          quantity: quantity && !isNaN(quantity) ? quantity : undefined,
          completed: false,
          createdAt: Date.now(),
        },
      });
      await addItem(formData);
    });
    formRef.current?.reset();
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      addOptimistic({ type: "toggle", id });
      await toggleItem(id);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      addOptimistic({ type: "delete", id });
      await deleteItem(id);
    });
  }

  function handleClearCompleted() {
    startTransition(async () => {
      addOptimistic({ type: "clear_completed" });
      await clearCompleted();
    });
  }

  async function handleLogout() {
    await fetch("/api/shop/auth", { method: "DELETE" });
    router.push("/shop/login");
  }

  return (
    <div className="bg-ctp-mantle rounded-lg border border-ctp-surface0 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ctp-surface0 shrink-0">
        <h1 className="text-xl font-bold text-ctp-text">Shopping List</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-ctp-subtext0 hover:text-ctp-red transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Add Item Form */}
      <form ref={formRef} action={handleAddItem} className="p-4 border-b border-ctp-surface0 shrink-0">
        <div className="flex gap-2">
          <input
            name="item"
            type="text"
            placeholder="Add item..."
            list="item-suggestions"
            className="flex-1 px-3 py-2 bg-ctp-base border border-ctp-surface0 rounded-md text-ctp-text placeholder:text-ctp-overlay0 focus:outline-none focus:border-ctp-mauve"
            autoComplete="off"
            required
          />
          <datalist id="item-suggestions">
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <input
            name="quantity"
            type="number"
            min="1"
            placeholder="Qty"
            className="w-16 px-2 py-2 bg-ctp-base border border-ctp-surface0 rounded-md text-ctp-text placeholder:text-ctp-overlay0 focus:outline-none focus:border-ctp-mauve text-center"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-ctp-mauve text-ctp-base font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </div>
      </form>

      {/* Items List - Scrollable */}
      <ul className="divide-y divide-ctp-surface0 overflow-y-auto flex-1 min-h-0">
        {items.length === 0 ? (
          <li className="p-8 text-center text-ctp-subtext0">
            No items yet. Add something!
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 p-4 hover:bg-ctp-surface0/30 transition-colors ${
                item.id.startsWith("temp-") ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => handleToggle(item.id)}
                className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                  item.completed
                    ? "bg-ctp-green border-ctp-green"
                    : "border-ctp-overlay0 hover:border-ctp-mauve"
                }`}
              >
                {item.completed && (
                  <svg
                    className="w-3 h-3 text-ctp-base"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <span
                  className={
                    item.completed
                      ? "text-ctp-overlay0 line-through"
                      : "text-ctp-text"
                  }
                >
                  {item.name}
                  {item.quantity && (
                    <span className="ml-2 text-sm text-ctp-subtext0">
                      ({item.quantity})
                    </span>
                  )}
                </span>
                <div className="text-xs text-ctp-overlay0 mt-0.5">
                  {formatTimeAgo(item.createdAt)}
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 shrink-0 text-ctp-overlay0 hover:text-ctp-red transition-colors"
                title="Delete"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Footer */}
      {completedCount > 0 && (
        <div className="p-4 border-t border-ctp-surface0 shrink-0">
          <button
            onClick={handleClearCompleted}
            className="text-sm text-ctp-subtext0 hover:text-ctp-red transition-colors"
          >
            Clear {completedCount} completed item{completedCount > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
