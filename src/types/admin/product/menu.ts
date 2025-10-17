export type MenuItem = {
  id: string;
  name: string;
  price: string;
  description: string | null;
  image: string | null;
  category: { id: string; name: string; description: string | null; type: "MENU"; isActive: boolean; sortOrder: number; createdAt: string; updatedAt: string } | null;
  isAvailable: boolean;
  ingredients: Array<{
    id: string;
    quantity: string;
    note: string | null;
    inventoryItem?: { id: string; name: string; unit?: string } | null;
  }>;
  isCombo?: boolean;
  components?: Array<{ id: string; quantity: number; item?: { id: string; name: string }; note?: string | null }>;
};

export type UpdateMenuItemInput = {
  id: string;
  name?: string;
  price?: number | string;
  description?: string;
  categoryId?: string;
  isAvailable?: boolean;
  ingredients?: Array<{ inventoryItemId: string; quantity: number; note?: string }>;
  image?: File | null;
};