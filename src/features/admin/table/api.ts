// src/features/table/api.ts
import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type AreaStatusApi = "AVAILABLE" | "UNAVAILABLE";
export type TableStatusApi = "ACTIVE" | "INACTIVE";

export interface DiningTableDTO {
  id: string;
  name: string;
  seats: number;
  note?: string | null;
  status: TableStatusApi;
  order?: number | null;
  areaId: string; // backend có thể không trả, nhưng giữ để post/patch
}

export interface AreaDTO {
  id: string;
  name: string;
  note?: string | null;
  status: AreaStatusApi;
  tables: DiningTableDTO[]; // <— quan trọng
}

export interface CreateAreaInput {
  name: string;
  note?: string;
  status: AreaStatusApi;
}
export interface CreateTableInput {
  name: string;
  seats: number;
  note?: string;
  areaId: string;
  status: TableStatusApi;
}

// Calls
async function getAreas(): Promise<AreaDTO[]> {
  const { data } = await api.get<AreaDTO[]>("/area/get-list-area");
  return data;
}
async function postArea(body: CreateAreaInput) {
  const { data } = await api.post<AreaDTO>("/area/create-area", body);
  return data;
}
// các endpoint bàn của bạn vẫn giữ nguyên nếu backend có:
async function postTable(body: CreateTableInput) {
  const { data } = await api.post<DiningTableDTO>("/restauranttable/create-table", body);
  return data;
}
async function patchTable(id: string, body: Partial<CreateTableInput>) {
  const { data } = await api.patch<DiningTableDTO>(`/restauranttable/${id}`, body);
  return data;
}
async function deleteTable(id: string) {
  await api.delete(`/restauranttable/${id}`);
  return id;
}

// Hooks
export const useAreas = () => useQuery({ queryKey: ["areas"], queryFn: getAreas });
export const useCreateArea = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postArea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
};
export const useCreateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postTable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }), // <— invalidate areas để refresh mảng tables
  });
};
export const useUpdateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateTableInput> }) =>
      patchTable(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
};
export const useDeleteTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
};
