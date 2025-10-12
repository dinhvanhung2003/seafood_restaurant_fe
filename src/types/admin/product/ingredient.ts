// types/admin/ingredient.ts
export interface IngredientDTO {
  id: string;
  name: string;
  unit: string;              // "kg", "chai", ...
  quantity: number;
  alertThreshold: number;
  description?: string | null;
  updatedAt?: string | null; // ISO
}

export interface CreateIngredientInput {
  name: string;
  unit: string;
  quantity: number;
  alertThreshold: number;
  description?: string;
}
