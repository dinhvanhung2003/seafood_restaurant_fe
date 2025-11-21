// types/uom.ts
export type UnitOfMeasure = {
    code: string;
    name: string;
    dimension: "mass" | "volume" | "count" | "length";
    baseCode?: string | null;
    // human-friendly name of the base unit
    baseName?: string | null;
    // whether this uom is active
    isActive?: boolean;
};

export type UnitOfMeasureListResponse = {
    data: UnitOfMeasure[];
    meta: { total: number; page: number; limit: number; pages: number };
};

export type UnitOfMeasureQuery = {
    page?: number;
    limit?: number;
    // Search
    q?: string;         // ILIKE search on code or name
    code?: string;      // exact match by code
    name?: string;      // contains by name
    dimension?: UnitOfMeasure["dimension"]; // filter by dimension
    // Sorting
    sortBy?: "code" | "name" | "dimension";
    sortDir?: "ASC" | "DESC";
    // Filter by active state
    isActive?: boolean;
};

export type CreateUomPayload = {
    code: string;
    name: string;
    dimension: "mass" | "volume" | "count" | "length";
    baseCode?: string | null;
};

export type UpdateUomPayload = Partial<CreateUomPayload>;
