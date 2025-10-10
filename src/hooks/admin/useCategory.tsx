// hooks/useCategories.ts
"use client";

import { keepPreviousData, useQuery ,useMutation} from "@tanstack/react-query";
import api from "@/lib/axios";
import type { CreateCategoryPayload } from "@/types/admin/category";
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
export function useCreateCategory(opts?: { accessToken?: string }) {
  const { accessToken } = opts || {};

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const { data } = await api.post(
        "/category/create-category",
        { ...payload, sortOrder: Number(payload.sortOrder ?? 0) },
        accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined
      );
      return data;
    },
  });
}
