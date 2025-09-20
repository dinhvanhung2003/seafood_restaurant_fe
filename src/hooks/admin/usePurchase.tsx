// src/hooks/purchase/usePurchaseReceipts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function usePRList(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["pr-list", params],
    queryFn: async () => (await api.get("/purchasereceipt/list", { params })).data,
  });
}

export function usePROne(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ["pr-one", id],
    queryFn: async () => (await api.get(`/purchasereceipt/getId/${id}`)).data,
  });
}

export function usePRCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) =>
      (await api.post("/purchasereceipt/create-purchase-receipt", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pr-list"] }),
  });
}
