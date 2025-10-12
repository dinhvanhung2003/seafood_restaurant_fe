// types/category.ts
export type Category = {
  id: string;
  name: string;
  description: string | null;
  type: string;        // ví dụ: "MENU"
  isActive: boolean;
  sortOrder: number;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
};

export type CategoryListResponse = {
  data: Category[];
  meta: { total: number; page: number; limit: number; pages: number };
};

export type CategoryQuery = {
  type?: string;       // e.g. MENU
  isActive?: string;   // "true" | "false"
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;       // e.g. createdAt:DESC
};
export type CreateCategoryPayload = {
  name: string;
  description?: string | null;
  type: "MENU" | "INGREDIENT";
  sortOrder?: number; // default 0
};