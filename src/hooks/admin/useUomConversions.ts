// hooks/admin/useUomConversions.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type {
    UomConversionListResponse,
    UomConversion,
    UomConversionQuery,
    CreateUomConversionPayload,
    UpdateUomConversionPayload,
} from "@/types/admin/product/uom-conversion";

// REST hooks cho chuyển đổi đơn vị (UOM Conversion)
const uomConv = createRestHooks<
    UomConversionListResponse,
    UomConversion,
    UomConversionQuery,
    CreateUomConversionPayload,
    UpdateUomConversionPayload
>({
    key: "uom-conversions",
    list: { path: "/uomconversion" },
    create: { path: "/uomconversion", method: "post" },
    update: { path: () => "/uomconversion", method: "put" },
    staleTime: 30_000,
});

export const {
    useListQuery: useUomConversionsQuery,
    useCreateMutation: useCreateUomConversionMutation,
    useUpdateMutation: useUpdateUomConversionMutation,
} = uomConv;
