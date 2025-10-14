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

  // CREATE (optimistic chỉ khi đang ở trang 1 để không lệch phân trang)
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onMutate: async (payload) => {
      const key = employeesKey(page, limit, q);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ListUsersResp>(key);

      if (meta.page === 1) {
        const optimistic: UserItem = {
          id: crypto.randomUUID(),
          email: payload.email,
          phoneNumber: payload.phoneNumber ?? "",
          username: payload.username ?? "",
          role: payload.role,
          profile: { fullName: payload.profile.fullName },
        };

        qc.setQueryData<ListUsersResp>(key, (old) => {
          const curr =
            old ??
            ({
              code: 200,
              success: true,
              message: "OK",
              data: [],
              meta: { total: 0, page: 1, limit, pages: 1 },
            } as ListUsersResp);
          return {
            ...curr,
            data: [optimistic, ...(curr.data ?? [])],
            meta: { ...curr.meta, total: (curr.meta?.total ?? 0) + 1 },
          };
        });

        toast.success("Đã thêm nhân viên", {
          description: optimistic.profile?.fullName,
          duration: 1200,
        });
      }

      return { previous };
    },
    onError: (_e, _p, ctx) => {
      const key = employeesKey(page, limit, q);
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Thêm nhân viên thất bại");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees-users"] });
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
