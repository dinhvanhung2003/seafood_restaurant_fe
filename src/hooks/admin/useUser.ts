"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { EMPLOYEES_ROOT_KEY } from "@/hooks/admin/useEmployee";
import { userProfileKey, meKey } from "@/hooks/admin/useProfile";

export type UpdateUserPayload = Partial<{
  username: string;
  phoneNumber: string;
}>;

async function patchUser(userId: string, payload: UpdateUserPayload) {
  const res = await api.patch(`/user/update-user/${userId}`, payload);
  return res.data?.data ?? res.data;
}

function pickApiMessage(err: any) {
  // BE bạn trả: { success, code, message, ... }
  return (
    err?.response?.data?.message ??
    err?.message ??
    "Cập nhật thất bại"
  );
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { userId: string; data: UpdateUserPayload }) =>
      patchUser(vars.userId, vars.data),

    onSuccess: (_updated, vars) => {
      toast.success("Cập nhật tài khoản thành công");
      qc.invalidateQueries({ predicate: (q) => q.queryKey?.[0] === "employees-users" });
      qc.invalidateQueries({ queryKey: userProfileKey(vars.userId) });
      qc.invalidateQueries({ queryKey: meKey });
    },

    onError: (err: any) => {
      toast.error(pickApiMessage(err)); // ✅ sẽ hiện "Số điện thoại đã tồn tại..."
    },
  });
}
