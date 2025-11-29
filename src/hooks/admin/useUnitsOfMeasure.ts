// hooks/admin/useUnitsOfMeasure.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
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

// Additional mutations for active/deactivate endpoints
export function useDeactivateUomMutation(options?: any) {
    const qc = useQueryClient();
    return useMutation<any, Error, { code: string }>(
        {
            mutationFn: async (args: { code: string }) => {
                const { code } = args;
                const res = await api.patch(`/units-of-measure/${code}/deactivate`);
                return res.data;
            },
            onSuccess: (...a: any[]) => {
                qc.invalidateQueries({ queryKey: ["units-of-measure"] });
                options?.onSuccess?.(...(a as any));
            },
            ...(options || {}),
        } as any
    );
}

export function useActivateUomMutation(options?: any) {
    const qc = useQueryClient();
    return useMutation<any, Error, { code: string }>(
        {
            mutationFn: async (args: { code: string }) => {
                const { code } = args;
                const res = await api.patch(`/units-of-measure/${code}/activate`);
                return res.data;
            },
            onSuccess: (...a: any[]) => {
                qc.invalidateQueries({ queryKey: ["units-of-measure"] });
                options?.onSuccess?.(...(a as any));
            },
            ...(options || {}),
        } as any
    );
}

export type UomUsageResponse = {
    code: string;
    isUsed: boolean; // Quan trọng nhất cái này
    counts: {
        inventoryItems: number;
        conversions: number;
        purchaseReceiptItems: number;
        purchaseReturnLogs: number;
        ingredients: number;
    };
};

export function useUomUsageQuery(code: string, options?: { enabled?: boolean }) {
    return useQuery<UomUsageResponse>({
        queryKey: ["units-of-measure", code, "usage"],
        queryFn: async () => {
            // Gọi vào API bạn vừa viết ở Controller
            const res = await api.get(`/units-of-measure/${code}/usage`);
            return res.data?.data; // Lấy cục data trong response chuẩn của bạn
        },
        enabled: !!code && (options?.enabled ?? true), // Chỉ chạy khi có code và dialog mở
        staleTime: 0, // Luôn fetch mới nhất để đảm bảo chính xác
    });
}
