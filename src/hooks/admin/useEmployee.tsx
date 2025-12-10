// hooks/admin/useEmployee.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { CreateUserPayload, EmployeeRow, UserItem } from "@/types/types";

/* ===== Types ===== */
export type PageMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type ListUsersResp = {
  code: number;
  success: boolean;
  message: string;
  data: UserItem[];
  meta: PageMeta;
};

/* ===== Query Key ===== */
export const employeesKey = (page: number, limit: number, q: string) =>
  ["employees-users", { page, limit, q }] as const;

/* ===== API ===== */
async function fetchUsers(
  page: number,
  limit: number,
  q: string
): Promise<ListUsersResp> {
  const { data } = await api.get("/user/get-list-user", {
    params: { page, limit, q },
  });
  return data as ListUsersResp;
}

async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post("/user/create-user", payload);
  return data?.data ?? data;
}

/* ===== Mapper ===== */
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

/* ===== Main Hook (phân trang + search) ===== */
export function useEmployee(page: number, limit: number, q: string) {
  const qc = useQueryClient();

  // LIST
  const listQuery = useQuery<ListUsersResp>({
    queryKey: employeesKey(page, limit, q),
    queryFn: () => fetchUsers(page, limit, q),
    // v5: thay cho keepPreviousData
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const items = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta ?? { total: 0, page, limit, pages: 0 };
  const createMutation = useMutation({
  mutationFn: (payload: CreateUserPayload) => createUser(payload),

  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["employees-users"] });
    toast.success("Đã thêm nhân viên");
  },

  onError: (e: any) => {
    const msg = e?.response?.data?.message || "Thêm nhân viên thất bại";
    toast.error(msg);
  }
});


  return {
    rows: items.map(toRow),
    meta,
    total: meta.total,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
    createUser: createMutation.mutateAsync,
    createStatus: {
      isPending: createMutation.isPending,
      isSuccess: createMutation.isSuccess,
      error: (createMutation.error as Error) ?? null,
    },
  };
}

export default useEmployee;
