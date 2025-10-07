// hooks/admin/useSchedule.ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export type ScheduleRow = {
  id: string;
  date: string;           // "2025-10-06"
  note?: string | null;
  repeatGroupId?: string | null;
  user: { id: string; email: string; profile?: { fullName?: string } };
  shift: { id: string; name: string; startTime: string; endTime: string; color?: string | null };
};

export const schedulesKey = (start: string, end: string, userIds?: string[]) =>
  ["schedules", start, end, ...(userIds ?? [])] as const;

export function useWeekSchedules(start: string, end: string, userIds?: string[]) {
  return useQuery({
    queryKey: schedulesKey(start, end, userIds),
    queryFn: async () => {
      const params = new URLSearchParams({ start, end });
      if (userIds?.length) params.set("userIds", userIds.join(","));
      const { data } = await api.get(`/schedules/week?${params.toString()}`);
      return data as ScheduleRow[];
    },
    staleTime: 30_000,
    enabled: Boolean(start && end),
  });
}

export type CreateSchedulePayload = {
  userId: string; date: string; shiftId: string; note?: string;
  repeatWeekly?: boolean; repeatUntil?: string; applyToUserIds?: string[];
};

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => api.post("/schedules", payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { shiftId?: string; date?: string; note?: string } }) =>
      api.patch(`/schedules/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}
