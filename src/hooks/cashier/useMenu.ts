"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchMenu(params: any, token?: string) {
  const url = new URL(`${API_BASE}/menuitems/list-menuitems`);
  const qp = { ...params, limit: Math.max(1, Math.min(Number(params.limit ?? 12), 100)) };
  Object.entries(qp).forEach(([k, v]) => v != null && v !== "" && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useMenu({
  page, limit, search, categoryId, token,
}: { page:number; limit:number; search:string; categoryId:string; token?:string }) {
  return useQuery({
    queryKey: ["menu", { page, limit, search, categoryId, token }],
    queryFn: () => fetchMenu({
      page,
      limit,
      search: search || undefined,
      categoryId: categoryId === "all" ? undefined : categoryId,
      sortBy: "name",
      order: "ASC",
    }, token),
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
