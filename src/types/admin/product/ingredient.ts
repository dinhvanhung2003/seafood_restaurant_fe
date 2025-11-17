// types/admin/ingredient.ts
export interface IngredientDTO {
  id: string;
  name: string;
  unit: string;              // "kg", "chai", ...
  quantity: number;
  alertThreshold: number;
  description?: string | null;
  updatedAt?: string | null; // ISO
  unitCode?: string;       // "KG", "CAN", ...
  isActive?: boolean;      // !isDeleted from BE
  category?: { id: string; name: string } | null;
}

export interface CreateIngredientInput {
  name: string;
  unit: string;
  alertThreshold: number;
  description?: string;
  categoryId?: string; // Loại nguyên liệu (tùy chọn)
}

export interface UpdateIngredientInput {
  name?: string;
  alertThreshold?: number;
  description?: string | null;
  categoryId?: string | null;
}
