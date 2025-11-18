// src/hooks/admin/useSalarySetting.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export type SalaryType = "FIXED" | "PER_SHIFT" | "PER_HOUR" | "PER_STANDARD_DAY";

export type BonusRule = {
  fromRevenue: number;   // từ doanh thu bao nhiêu
  percent: number;       // % thưởng
};

export type AllowanceRule = {
  name: string;
  type: "PER_DAY_FIXED" | "PER_MONTH_FIXED";
  amount: number;
};

export type DeductionRule = {
  name: string;
  // Đi muộn / Về sớm / Cố định
  kind: "LATE" | "EARLY" | "FIXED";
  // Điều kiện
  condition: "BY_TIMES" | "BY_BLOCK";
  // chỉ dùng khi condition = BY_BLOCK (phạt theo block X phút)
  blockMinutes?: number | null;
  amountPerUnit: number;
}

export type SalaryMeta = {
  bonusEnabled?: boolean;
  bonusType?: "PERSONAL_REVENUE";
  bonusRules?: BonusRule[];

  allowanceEnabled?: boolean;
  allowances?: AllowanceRule[];

  deductionEnabled?: boolean;
  deductions?: DeductionRule[];
};

export type SalarySetting = {
  id: string;
  salaryType: SalaryType;
  baseAmount: string;
  overtimeRate: string | null;
  meta?: SalaryMeta | null;
};

type ApiResp<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
};

export const salarySettingKey = (staffId?: string) =>
  ["salary-setting", staffId] as const;

export type UpsertSalarySettingPayload = {
  staffId: string;
  salaryType: SalaryType;
  baseAmount: string;
  overtimeRate?: string;
  meta?: SalaryMeta;
};

// ===== API =====
async function fetchSalarySetting(staffId: string): Promise<SalarySetting | null> {
  const { data } = await api.get<ApiResp<SalarySetting | null>>(
    `/salary-settings/${staffId}`
  );
  return data.data;
}

async function upsertSalarySettingApi(
  payload: UpsertSalarySettingPayload
): Promise<SalarySetting> {
  const { data } = await api.post<ApiResp<SalarySetting>>(
    "/salary-settings",
    payload
  );
  return data.data;
}

// ===== Hooks =====
export function useSalarySetting(staffId?: string) {
  return useQuery<SalarySetting | null, Error>({
    queryKey: salarySettingKey(staffId),
    enabled: !!staffId,
    queryFn: () => fetchSalarySetting(staffId!),
  });
}

export function useUpsertSalarySetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertSalarySettingApi,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: salarySettingKey(vars.staffId) });
    },
  });
}
