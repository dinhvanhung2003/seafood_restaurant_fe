// hooks/admin/useProfile.ts (hoặc file bạn đang dùng)

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

/** ===== Types dùng lại từ bạn ===== */
export type Role = "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN" | string;

export type MeUser = {
  id: string;
  email: string;
  username: string | null;
  phoneNumber: string | null;
  role: Role;
  status: "ACTIVE" | "INACTIVE" | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
};

export type MeProfile = {
  id: string;
  fullName: string | null;
  dob: string | null;             // "YYYY-MM-DD"
  avatar: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  addressList: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  user: MeUser;
};

export type ApiResponse<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
};

export type UpdateProfilePayload = Partial<{
  fullName: string;
  dob: string;             // "YYYY-MM-DD"
  description: string;
  address: string;
  city: string;
  country: string;
  addressList: string[];   // sẽ stringify khi gửi
  avatar: File;            // optional
}>;

/** ===== Query Keys ===== */
export const meKey = ["me"] as const;
export const userProfileKey = (userId?: string) => ["user-profile", userId] as const;

/** ===== API ===== */

// GET /profile/me
async function fetchMe(): Promise<MeProfile> {
  const { data } = await api.get<ApiResponse<MeProfile>>("/profile/me");
  return data.data;
}

// NEW: GET /profile/get-profile/:userId
async function fetchUserProfile(userId: string): Promise<MeProfile> {
  const { data } = await api.get<ApiResponse<MeProfile>>(`/profile/get-profile/${userId}`);
  return data.data;
}

// PATCH /profile/update-profile/:userId (multipart)
async function patchUserProfile(userId: string, payload: UpdateProfilePayload) {
  const fd = new FormData();
  if (payload.fullName != null) fd.set("fullName", payload.fullName);
  if (payload.dob != null) fd.set("dob", payload.dob);
  if (payload.description != null) fd.set("description", payload.description);
  if (payload.address != null) fd.set("address", payload.address);
  if (payload.city != null) fd.set("city", payload.city);
  if (payload.country != null) fd.set("country", payload.country);
  if (payload.addressList) fd.set("addressList", JSON.stringify(payload.addressList));
  if (payload.avatar) fd.set("avatar", payload.avatar);

  const { data } = await api.patch<ApiResponse<MeProfile>>(
    `/profile/update-profile/${userId}`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
}
/** ===== Hooks: /me ===== */
export function useMeQuery() {
  return useQuery<MeProfile, Error>({
    queryKey: meKey,
    queryFn: fetchMe,
    staleTime: 60_000,
  });
}

/** ===== Hooks: profile theo userId ===== */
export function useUserProfileQuery(userId?: string) {
  return useQuery<MeProfile, Error>({
    queryKey: userProfileKey(userId),
    enabled: !!userId,
    queryFn: () => fetchUserProfile(userId!),
    staleTime: 60_000,
  });
}

export function useUpdateUserProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; data: UpdateProfilePayload }) =>
      patchUserProfile(vars.userId, vars.data),
    onSuccess: (updated) => {
      // refresh cache cho profile của user đó
      qc.invalidateQueries({ queryKey: userProfileKey(updated.user.id) });
      // nếu chính mình cập nhật thì refresh luôn /me
      qc.invalidateQueries({ queryKey: meKey });
    },
  });
}

/** (tuỳ chọn) update "hồ sơ của tôi" ngắn gọn */
export function useUpdateMyProfile() {
  const me = useMeQuery();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => patchUserProfile(me.data!.user.id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: meKey });
      qc.invalidateQueries({ queryKey: userProfileKey(updated.user.id) });
    },
  });
}
