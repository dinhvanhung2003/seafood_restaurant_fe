// types/uom.ts
export type UnitOfMeasure = {
    code: string;        // e.g. "G", "KG", "CAN"
    name: string;        // e.g. "Gram", "Kilogram"
    dimension: "count" | "mass" | "volume"; // logical dimension
    createdAt?: string;  // optional ISO string (if BE provides)
    updatedAt?: string;  // optional ISO string
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
};

export type CreateUomPayload = {
    code: string;
    name: string;
    dimension: UnitOfMeasure["dimension"];
};

export type UpdateUomPayload = Partial<CreateUomPayload>;
