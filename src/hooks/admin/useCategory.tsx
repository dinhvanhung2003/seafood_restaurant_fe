// hooks/useCategory.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type {
  Category,
  CategoryListResponse,
  CategoryQuery,
} from "@/types/admin/product/category";
import type { CreateCategoryPayload } from "@/types/admin/product/category";

const category = createRestHooks<
  CategoryListResponse,
  Category,
  CategoryQuery,
  CreateCategoryPayload,
  Partial<CreateCategoryPayload> & { isActive?: boolean }
>({
  key: "categories",
  list: { path: "/category/list-category" },
  create: { path: "/category/create-category", method: "post" },
  update: {
    path: ({ id }: { id: string }) => `/category/update-category/${id}`,
    method: "patch",
  },
  remove: {
    path: ({ id }: { id: string }) => `/category/delete-category/${id}`,
    method: "delete",
  },

  staleTime: 30_000,
});

export const {
  useListQuery: useCategoriesQuery,
  useCreateMutation: useCreateCategoryMutation,
  useUpdateMutation: useUpdateCategoryMutation,
  useRemoveMutation: useRemoveCategoryMutation,
} = category;
