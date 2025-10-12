// hooks/admin/useIngredient.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type { IngredientDTO, CreateIngredientInput } from "@/types/admin/product/ingredient";

/**
 * Backend:
 *  - GET  /inventoryitems/list-ingredients
 *  - POST /inventoryitems/stockin-ingredients   (nhập kho / tạo mới)
 *
 * Ta coi "stock-in" là create-mutation cho resource ingredients.
 */
const ingredients = createRestHooks<
  IngredientDTO[],        // TList
  IngredientDTO,          // TItem
  void,                   // TListQuery (không có params)
  CreateIngredientInput,  // TCreateDto
  Partial<CreateIngredientInput> // TUpdateDto (nếu sau này có)
>({
  key: "ingredients",
  list:   { path: "/inventoryitems/list-ingredients" },
  create: { path: "/inventoryitems/stockin-ingredients", method: "post" },

  // Nếu sau này có API chỉnh sửa / xóa, mở comment dưới và dùng ngay:
  // detail: { path: ({ id }: { id: string }) => `/inventoryitems/${id}` },
  // update: { path: ({ id }: { id: string }) => `/inventoryitems/${id}`, method: "patch" },
  // remove: { path: ({ id }: { id: string }) => `/inventoryitems/${id}`, method: "delete" },
});

export const {
  useListQuery: useIngredients,            // -> const { data } = useIngredients();
  useCreateMutation: useStockInIngredient, // -> mutate(dto)
  // useDetailQuery: useIngredientDetail,
  // useUpdateMutation: useUpdateIngredient,
  // useRemoveMutation: useDeleteIngredient,
} = ingredients;
