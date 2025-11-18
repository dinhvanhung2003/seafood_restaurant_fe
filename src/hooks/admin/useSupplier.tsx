// hooks/admin/useSuppliers.ts
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import type {
  SuppliersFilter,
  Supplier,
  CreateSupplierBody,
  UpdateBody,
} from "@/types/types";

type ListResp = {
  code: number;
  success: boolean;
  message: string;
  data: Supplier[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

const clean = (p: Record<string, any>) => {
  const q = { ...p };
  Object.keys(q).forEach((k) =>
    (q as any)[k] === "" || (q as any)[k] == null ? delete (q as any)[k] : null
  );
  return q;
};

export function useSuppliers(
  page: number,
  limit: number,
  filters: SuppliersFilter,
  initialData?: ListResp
) {
  // ép withGroup = true để luôn có supplierGroup trong response
  const params = clean({
    page,
    limit,
    q: filters?.q,
    status: filters?.status,
    supplierGroupId: filters?.supplierGroupId,
    city: filters?.city,
    withGroup: true, //bắt buộc
  });

  return useQuery<ListResp>({
    queryKey: ["suppliers", params], // gom key gọn theo params đã clean
    queryFn: async () => {
      const { data } = await api.get<ListResp>("/supplier/get-list-suppliers", {
        params,
      });
      return data;
    },
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateSupplierBody) => {
      const { data } = await api.post("/supplier/create-supplier", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Tạo nhà cung cấp thành công");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Không thể tạo nhà cung cấp";
      toast.error(String(msg));
    },
  });
}

export function useSupplierDetail(id?: string, enabled = true) {
  return useQuery<Supplier>({
    queryKey: ["supplier", id],
    enabled: !!id && enabled,
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/supplier/get/${id}`);
      return data;
    },
  });
}

export function useChangeSupplierStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: "ACTIVE" | "INACTIVE" }) => {
      const { data } = await api.patch(`/supplier/${p.id}/status/${p.status}`);
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success("Cập nhật trạng thái thành công");
      qc.invalidateQueries({ queryKey: ["supplier", vars.id] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Đổi trạng thái thất bại");
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; body: UpdateBody }) => {
      const { data } = await api.patch(
        `/supplier/update-supplier/${p.id}`,
        p.body
      );
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success("Cập nhật nhà cung cấp thành công");
      qc.invalidateQueries({ queryKey: ["supplier", vars.id] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Cập nhật thất bại");
    },
  });
}

// Xoá hoặc ngừng hợp tác theo nghiệp vụ BE: nếu đã có giao dịch -> INACTIVE, nếu chưa -> xoá
export function useRemoveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // giả định endpoint DELETE; điều chỉnh nếu BE khác
      const { data } = await api.delete(`/supplier/delete-supplier/${id}`);
      return data; // { message: SUPPLIER_DEACTIVATED_BECAUSE_HAS_TRANSACTIONS | SUPPLIER_DELETED_SUCCESSFULLY, ... }
    },
    onSuccess: (res: any, id) => {
      let msg = res?.message;
      switch (msg) {
        case "SUPPLIER_DEACTIVATED_BECAUSE_HAS_TRANSACTIONS":
          toast.info(
            "Không xoá được vì đã có giao dịch. Nhà cung cấp đã được chuyển sang trạng thái ngừng hoạt động.",
            { id: `supplier-remove-${id}` }
          );
          break;
        case "SUPPLIER_DELETED_SUCCESSFULLY":
          toast.success("Đã xoá nhà cung cấp", {
            id: `supplier-remove-${id}`,
          });
          break;
        default:
          toast.success("Thao tác xoá nhà cung cấp hoàn tất", {
            id: `supplier-remove-${id}`,
          });
      }
      qc.invalidateQueries({ queryKey: ["supplier", id] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: any, id) => {
      toast.error(
        e?.response?.data?.message ??
          "Không thể xoá / ngừng hợp tác nhà cung cấp",
        { id: `supplier-remove-${id}` }
      );
    },
  });
}
