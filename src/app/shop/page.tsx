import { getItems, getSuggestions } from "./actions";
import ShopList from "./shop-list";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [items, suggestions] = await Promise.all([getItems(), getSuggestions()]);

  return (
    <main className="min-h-screen bg-ctp-base p-4">
      <div className="max-w-lg mx-auto">
        <ShopList initialItems={items} suggestions={suggestions} />
      </div>
    </main>
  );
}
