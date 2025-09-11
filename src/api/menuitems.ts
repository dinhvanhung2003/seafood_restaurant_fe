// api/menuitems.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type MenuItem = {
  id: string; name: string; price: string; description: string | null;
  image: string | null; isAvailable: boolean;
  category?: { id: string; name: string };
};

type MenuItemsList = {
  data: MenuItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type MenuItemsQuery = {
  page?: number;
  limit?: number;          // <= 100
  search?: string;
  categoryId?: string;
  isAvailable?: "true"|"false";
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "name" | "price" | "createdAt";
  order?: "ASC" | "DESC";
};

function buildUrl(path: string, params: Record<string, any>) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

export async function fetchMenuItems(params: MenuItemsQuery): Promise<MenuItemsList> {
  // chặn limit > 100
  const limit = Math.max(1, Math.min(Number(params.limit ?? 10), 100));
  const url = buildUrl("/menuitems/list-menuitems", { ...params, limit });

  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json();
}
