"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { keepPreviousData } from "@tanstack/react-query";
export type PayrollStatus = "DRAFT" | "TEMP" | "CLOSED" | "PAID";

export type PayrollSlipStatus = "DRAFT" | "CLOSED" | "PARTIALLY_PAID" | "PAID";

export type PayrollSlip = {
  id: string;
  code: string;
  staff: {
    id: string;
    email: string;
    profile?: {
      fullName: string | null;
    };
  };
  workingUnits: number;
  basicSalary: string;
  overtimeAmount: string;
  bonusAmount: string;
  commissionAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  status: PayrollSlipStatus;
};

export type Payroll = {
  id: string;
  code: string;
  name: string;
  payCycle: string;
  workDateFrom: string;
  workDateTo: string;
  status: PayrollStatus;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  slips?: PayrollSlip[];
};

type ApiResponse<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
};

type PageMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type PayrollListResp = {
  items: Payroll[];
  meta: PageMeta;
};

export const payrollListKey = (page: number, limit: number, q: string) =>
  ["payrolls", { page, limit, q }] as const;

export const payrollDetailKey = (id?: string) =>
  ["payroll-detail", id] as const;

// ===== API =====
async function fetchPayrolls(
  page: number,
  limit: number,
  q: string
): Promise<PayrollListResp> {
  const { data } = await api.get<
    ApiResponse<Payroll[]>,
    { data: ApiResponse<Payroll[]> }
  >("/payrolls", {
    params: { page, limit, q },
  });

  return {
    items: data.data,
    meta: {
      total: (data as any).meta?.total ?? 0,
      page: (data as any).meta?.page ?? page,
      limit: (data as any).meta?.limit ?? limit,
      pages: (data as any).meta?.pages ?? 1,
    },
  };
}

async function fetchPayrollDetail(id: string): Promise<Payroll> {
  const { data } = await api.get<ApiResponse<Payroll>>(`/payrolls/${id}`);
  return data.data;
}

export type CreatePayrollPayload = {
  name?: string;
  workDateFrom: string; // "YYYY-MM-DD"
  workDateTo: string;   // "YYYY-MM-DD"
  payCycle: string;     // "MONTHLY"
  applyAllStaff: boolean;
  staffIds?: string[];
};

async function createPayroll(payload: CreatePayrollPayload): Promise<Payroll> {
  const { data } = await api.post<ApiResponse<Payroll>>("/payrolls", payload);
  return data.data;
}export type ApiResp<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
};

export type PayPayrollPayload = {
  payrollId: string;
  payDate: string;
  method: "CASH" | "BANK";
  note?: string;
  slipIds: string[];
};

async function payPayrollApi(
  payload: PayPayrollPayload
): Promise<{ payroll: Payroll; paid: number }> {
  const { payrollId, ...body } = payload;
  const { data } = await api.post<
    ApiResponse<{ payroll: Payroll; paid: number }>
  >(`/payrolls/${payrollId}/pay`, body);
  return data.data;
}

// ===== Hooks =====
export function usePayrollList(page: number, limit: number, q: string) {
  return useQuery<PayrollListResp, Error>({
    queryKey: payrollListKey(page, limit, q),
    queryFn: () => fetchPayrolls(page, limit, q),
    placeholderData: keepPreviousData
  });
}

export function usePayrollDetail(id?: string) {
  return useQuery<Payroll, Error>({
    queryKey: payrollDetailKey(id),
    enabled: !!id,
    queryFn: () => fetchPayrollDetail(id!),
  });
}
export const payrollRootKey = ["payrolls"] as const;
export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollPayload) =>
      api
        .post<ApiResp<Payroll>>("/payrolls", payload) // hoặc "/payroll" tuỳ BE
        .then((res) => res.data.data),
    onSuccess() {
      // invalidate list
      qc.invalidateQueries({ queryKey: payrollRootKey });
    },
  });
}
export function usePayPayroll() {
  const qc = useQueryClient();
  return useMutation<{ payroll: Payroll; paid: number }, Error, PayPayrollPayload>(
    {
      mutationFn: payPayrollApi,
      onSuccess: (res) => {
        qc.invalidateQueries({ queryKey: payrollDetailKey(res.payroll.id) });
        // invalidate tất cả list payrolls
        qc.invalidateQueries({ queryKey: payrollRootKey });
      },
    }
  );
}
