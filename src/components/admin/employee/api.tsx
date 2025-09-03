import { api } from "@/lib/axios";
import type { CreateUserPayload, UserItem } from "@/types/employee";

/** GET danh sách user đơn giản */
export async function fetchUsers(): Promise<UserItem[]> {
  const { data } = await api.get("/user/get-list-user");
  return data?.data ?? data ?? [];
}

/** POST tạo user */
export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post("/user/create-user", payload);
  return data?.data ?? data;
}
