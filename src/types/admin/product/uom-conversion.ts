// types/uom-conversion.ts
export type UomConversion = {
    id?: string;
    fromCode: string; // nguồn (1 fromCode = factor toCode)
    toCode: string;   // đích
    factor: number;   // ví dụ: 1 PACK = 500 G -> factor=500
    createdAt?: string;
    updatedAt?: string;
};

export type UomConversionListResponse = {
    data: UomConversion[];
    meta: { total: number; page: number; limit: number; pages: number };
};

export type UomConversionQuery = {
    page?: number;
    limit?: number;
    fromCode?: string;
    toCode?: string;
};

export type CreateUomConversionPayload = {
    fromCode: string;
    toCode: string;
    factor: number;
};

export type UpdateUomConversionPayload = CreateUomConversionPayload;
