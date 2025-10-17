// hooks/useCategory.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type { Category, CategoryListResponse, CategoryQuery } from "@/types/admin/product/category";
import type { CreateCategoryPayload } from "@/types/admin/product/category";

const category = createRestHooks<CategoryListResponse, Category, CategoryQuery, CreateCategoryPayload, Partial<CreateCategoryPayload>>({
  key: "categories",
  list:   { path: "/category/list-category" },
  create: { path: "/category/create-category", method: "post" },
 
  staleTime: 30_000,
});

export const {
  useListQuery: useCategoriesQuery,
  useCreateMutation: useCreateCategoryMutation,
} = category;
