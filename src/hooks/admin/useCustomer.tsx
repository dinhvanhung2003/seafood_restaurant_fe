import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchCustomers, createCustomer } from "@/lib/admin/partner/customer/api";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { CustomersFilter } from "@/components/admin/partner/customer/filter/CustomerFilter";
function buildParams(page: number, limit: number, f: CustomersFilter) {
  const p: any = { page, limit };
  if (f.q) p.q = f.q;
  if (f.type) p.type = f.type;
  if (f.gender) p.gender = f.gender;
  if (f.createdFrom) p.createdFrom = f.createdFrom;
  if (f.createdTo) p.createdTo = f.createdTo;
  if (f.birthdayFrom) p.birthdayFrom = f.birthdayFrom;
  if (f.birthdayTo) p.birthdayTo = f.birthdayTo;
  if (f.province) p.province = f.province;
  if (f.district) p.district = f.district;
  if (f.ward) p.ward = f.ward;
  return p;
}

export function useCustomers(page: number, limit: number, filters: CustomersFilter) {
  return useQuery({
    queryKey: ["customers", page, limit, filters],
    queryFn: async () => {
      const params = buildParams(page, limit, filters);
      const res = await api.get("/customers", { params });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success("Thêm khách hàng thành công ✅");
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra ❌");
    },
  });
}
export function useCustomerDetail(id?: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`);
      return data.data ?? data; // nếu BE bọc {code, success, data}
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerInvoices(id?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["customer", id, "invoices", page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}/invoices`, { params: { page, limit } });
      // BE trả ResponseCommon { data: { items, meta } } hay bọc khác -> normalize
      return data.data ?? data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await api.patch(`/customers/${id}`, payload);
      return data.data ?? data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.setQueryData(["customer", data.id], data);
      toast.success("Cập nhật khách hàng thành công");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    },
  });
}