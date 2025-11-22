// src/hooks/admin/useFaceSnapshots.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/axios";

export type FaceSnapshotDto = {
  id: string;
  imageUrl: string;
  createdAt: string;
};

export async function fetchUserFaces(userId: string) {
  const res = await http.get<{
    userId: string;
    count: number;
    snapshots: FaceSnapshotDto[];
  }>(`/face/admin/user/${userId}`);
  return res.data.snapshots ?? [];
}

export function useFaceSnapshots(userId?: string) {
  return useQuery({
    queryKey: ["faceSnapshots", userId],
    enabled: !!userId,
    queryFn: () => fetchUserFaces(userId!),
  });
}

type AdminEnrollPayload = { userId: string; imageBase64: string };

export function useAdminFaceEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminEnrollPayload) =>
      http.post("/face/admin/enroll", payload),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: ["faceSnapshots", payload.userId] });
      qc.invalidateQueries({ queryKey: ["face-stats", payload.userId] }); // 👈 thêm dòng này
    },
  });
}

// ✅ reset toàn bộ khuôn mặt (AWS + local)
export function useAdminFaceReset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      http.post("/face/admin/reset", { userId }),
    onSuccess: (_res, userId) => {
      qc.invalidateQueries({ queryKey: ["faceSnapshots", userId] });
      qc.invalidateQueries({ queryKey: ["face-stats", userId] }); // 👈 thêm dòng này
    },
  });
}

// ✅ xoá 1 snapshot lẻ
export function useAdminDeleteSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; snapshotId: string }) =>
      http.delete(`/face/admin/snapshot/${params.snapshotId}`),
    onSuccess: (_res, params) => {
      qc.invalidateQueries({ queryKey: ["faceSnapshots", params.userId] });
      qc.invalidateQueries({ queryKey: ["face-stats", params.userId] }); // 👈 thêm dòng này
    },
  });
}

export function useFaceStats(userId?: string) {
  return useQuery({
    queryKey: ["face-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await http.get(`/face/admin/user/${userId}/stats`);
      return res.data as {
        userId: string;
        awsFaces: number;
        localSnapshots: number;
      };
    },
  });
}
