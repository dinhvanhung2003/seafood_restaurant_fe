// hooks/useCategories.ts
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { CategoryListResponse, CategoryQuery } from "@/types/admin/category";

export async function fetchCategories(
  params: CategoryQuery,
  signal?: AbortSignal
): Promise<CategoryListResponse> {
  const { data } = await api.get("/category/list-category", { params, signal });
  return data;
}

export function useCategories(params: CategoryQuery) {
  return useQuery<CategoryListResponse, Error>({
    queryKey: ["categories", params],
    queryFn: ({ signal }) => fetchCategories(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
