"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

type UseMenuArgs = {
  page: number;
  limit: number;
  search: string;
  categoryId: string;
};

// Nếu BE trả về { data, meta } thì giữ nguyên kiểu trả về như cũ
async function fetchMenu(params: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}) {
  const safeLimit = Math.max(1, Math.min(Number(params.limit ?? 12), 100));

  const { data } = await api.get("/menuitems/list-menuitems", {
    params: {
      ...params,
      limit: safeLimit,
      sortBy: "name",
      order: "ASC",
    },
  });

  return data;
}

export function useMenu({ page, limit, search, categoryId }: UseMenuArgs) {
  const cat = categoryId === "all" ? undefined : categoryId;
  const q = search || undefined;

  return useQuery({
    // ghi rõ "all" để phân biệt cache
    queryKey: ["menu", { page, limit, search: q ?? "", categoryId: categoryId ?? "all" }],
    queryFn: () => fetchMenu({ page, limit, search: q, categoryId: cat }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
