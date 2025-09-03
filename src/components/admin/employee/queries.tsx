"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateUserPayload, EmployeeRow, UserItem } from "@/types/employee";
import { createUser, fetchUsers } from "./api";

export const employeesKey = ["employees-users"];

/** Query danh sách user */
export function useEmployeesQuery() {
  return useQuery({
    queryKey: employeesKey,
    queryFn: fetchUsers,
    staleTime: 60_000,
  });
}

/** Map UserItem -> Row phẳng */
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

/** Tạo user (optimistic đơn giản) */
export function useCreateUserMutation() {
  const qc = useQueryClient();

  return useMutation({
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
      toast.success("Đã thêm nhân viên", { description: optimistic.profile?.fullName, duration: 1000 });
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
}
