import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface IngredientDTO {
  id: string;
  name: string;
  unit: string;               // ví dụ: "kg", "chai"...
  quantity: number;
  alertThreshold: number;
  description?: string | null;
  updatedAt?: string | null;  // ISO
}

export interface CreateIngredientInput {
  name: string;
  unit: string;
  quantity: number;
  alertThreshold: number;
  description?: string;
}

/* ===== Calls ===== */
async function getIngredients(): Promise<IngredientDTO[]> {
  const { data } = await api.get<IngredientDTO[]>("/inventoryitems/list-ingredients");
  return data;
}
async function stockInIngredient(body: CreateIngredientInput): Promise<IngredientDTO> {
  const { data } = await api.post<IngredientDTO>("/inventoryitems/stockin-ingredients", body);
  return data;
}

/* ===== Hooks ===== */
export const useIngredients = () =>
  useQuery({ queryKey: ["ingredients"], queryFn: getIngredients });

export const useStockInIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockInIngredient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
};
