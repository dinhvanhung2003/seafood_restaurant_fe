// hooks/admin/useEmployee.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios"; // nếu bạn export named { api } thì đổi dòng này cho khớp
import type { CreateUserPayload, EmployeeRow, UserItem } from "@/types/types";

/* ========== Query Key ========== */
export const employeesKey = ["employees-users"] as const;

/* ========== API (gói chung vào file này) ========== */
async function fetchUsers(): Promise<UserItem[]> {
  const { data } = await api.get("/user/get-list-user");
  return data?.data ?? data ?? [];
}

async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post("/user/create-user", payload);
  return data?.data ?? data;
}

/* ========== Mapper ========== */
export function toRow(u: UserItem): EmployeeRow {
  return {
    id: u.id,
    fullName: u.profile?.fullName || "",
    email: u.email,
    username: u.username || "",
    phoneNumber: u.phoneNumber || "",
    role: u.role,
  };
}

/* ========== Main Hook ========== */
export function useEmployee() {
  const qc = useQueryClient();

  // ---- LIST ----
  const listQuery = useQuery({
    queryKey: employeesKey,
    queryFn: fetchUsers,
    staleTime: 60_000,
  });

  // ---- CREATE (optimistic) ----
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: employeesKey });
      const previous = qc.getQueryData<UserItem[]>(employeesKey) || [];

      const optimistic: UserItem = {
        id: crypto.randomUUID(),
        email: payload.email,
        phoneNumber: payload.phoneNumber ?? "",
        username: payload.username ?? "",
        role: payload.role,
        profile: { fullName: payload.profile.fullName },
      };

      qc.setQueryData<UserItem[]>(employeesKey, [optimistic, ...previous]);
      toast.success("Đã thêm nhân viên", {
        description: optimistic.profile?.fullName,
        duration: 1200,
      });
      return { previous };
    },

    onError: (_e, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(employeesKey, ctx.previous);
      toast.error("Thêm nhân viên thất bại");
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeesKey });
    },
  });

  return {
    /* data */
    employees: listQuery.data ?? [],
    rows: (listQuery.data ?? []).map(toRow),
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,

    /* actions */
    createUser: createMutation.mutateAsync,

    /* status (nếu UI cần) */
    createStatus: {
      isPending: createMutation.isPending,
      isSuccess: createMutation.isSuccess,
      error: (createMutation.error as Error) ?? null,
    },
  };
}

export default useEmployee;
