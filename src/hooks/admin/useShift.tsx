"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

/* ===== Types ===== */
export type Shift = {
  id: string;
  name: string;
  startTime: string;   // "07:00"
  endTime: string;     // "11:00"
  checkInFrom?: string | null; // "04:00"
  checkInTo?: string | null;   // "14:00"
  isActive: boolean;
  color?: string | null;
};

export type ShiftPayload = Omit<Shift, "id">;

export const shiftsKey = ["shifts"] as const;

/* ===== Queries ===== */
export function useShiftsQuery() {
  return useQuery<{ data: Shift[] }>({
    queryKey: shiftsKey,
    queryFn: async () => {
      // đổi path cho khớp BE của bạn: /shifts hoặc /shift/list
      const { data } = await api.get("/shifts");
      return data;
    },
    staleTime: 60_000,
  });
}

/* ===== Mutations ===== */
export function useCreateShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ShiftPayload) => {
      const { data } = await api.post("/shifts", payload); // đổi path nếu khác
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftsKey }),
  });
}

export function useUpdateShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: ShiftPayload }) => {
      const res = await api.patch(`/shifts/${id}`, payload); // đổi path nếu khác
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftsKey }),
  });
}

export function useDeleteShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/shifts/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftsKey }),
  });
}
