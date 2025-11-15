// hooks/admin/useUnitsOfMeasure.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type {
    UnitOfMeasure,
    UnitOfMeasureListResponse,
    UnitOfMeasureQuery,
    CreateUomPayload,
    UpdateUomPayload,
} from "@/types/admin/product/uom";

// Centralized REST hooks for Units of Measure
const uom = createRestHooks<
    UnitOfMeasureListResponse,
    UnitOfMeasure,
    UnitOfMeasureQuery,
    CreateUomPayload,
    UpdateUomPayload
>({
    key: "units-of-measure",
    list: { path: "/units-of-measure" },
    detail: { path: (args: { code: string }) => `/units-of-measure/${args.code}` },
    create: { path: "/units-of-measure", method: "post" },
    update: { path: (args: { code: string }) => `/units-of-measure/${args.code}`, method: "patch" },
    remove: { path: (args: { code: string }) => `/units-of-measure/${args.code}`, method: "delete" },
    staleTime: 30_000,
});

export const {
    useListQuery: useUomsQuery,
    useDetailQuery: useUomDetailQuery,
    useCreateMutation: useCreateUomMutation,
    useUpdateMutation: useUpdateUomMutation,
    useRemoveMutation: useRemoveUomMutation,
} = uom;
