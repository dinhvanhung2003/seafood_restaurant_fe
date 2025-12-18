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
export const EMPLOYEES_ROOT_KEY = ["employees-users"] as const;

export const employeesKey = (page: number, limit: number, q: string) =>
  [...EMPLOYEES_ROOT_KEY, { page, limit, q }] as const;

/* ===== API ===== */
async function fetchUsers(page: number, limit: number, q: string): Promise<ListUsersResp> {
  const { data } = await api.get("/user/get-list-user", { params: { page, limit, q } });
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
    fullName: u.profile?.fullName ?? "",
    email: u.email ?? "",                // ✅ tránh undefined/null
    username: u.username ?? "",
    phoneNumber: u.phoneNumber ?? "",
    role: u.role,
    address: u.profile?.address ?? "",   // ✅ ép null -> ""
  };
}

/* ===== Main Hook (phân trang + search) ===== */
export function useEmployee(page: number, limit: number, q: string) {
  const qc = useQueryClient();

  const listQuery = useQuery<ListUsersResp>({
    queryKey: employeesKey(page, limit, q),
    queryFn: () => fetchUsers(page, limit, q),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const items = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta ?? { total: 0, page, limit, pages: 0 };

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),

    onSuccess: () => {
      // ✅ invalidate tất cả biến thể page/limit/q
      qc.invalidateQueries({
        predicate: (q) => q.queryKey?.[0] === EMPLOYEES_ROOT_KEY[0],
      });
      toast.success("Đã thêm nhân viên");
    },

    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? e?.message ?? "Thêm nhân viên thất bại";
      toast.error(msg);
    },
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
