// hooks/cashier/useCustomerSuggest.ts
"use client";
import { useMemo } from "react";
import { useCustomers } from "@/hooks/admin/useCustomer";
import type { CustomersFilter } from "@/components/admin/partner/customer/filter/CustomerFilter";
export function useCustomer(q: string, limit = 8) {
  const enabled = q.trim().length >= 2;
  const filters = useMemo(() => ({ q: q.trim() } as CustomersFilter), [q]);
  const query = useCustomers(1, limit, filters);
  const list =
    Array.isArray((query.data as any)?.data) ? (query.data as any).data :
    Array.isArray((query.data as any)?.items) ? (query.data as any).items :
    Array.isArray(query.data as any) ? (query.data as any) : [];

  return { ...query, data: list, enabled };
}

