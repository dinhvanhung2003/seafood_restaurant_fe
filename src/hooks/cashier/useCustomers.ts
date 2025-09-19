"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  attachCustomerToOrder,
  createCustomer,
  createAndAttachCustomer,
  searchCustomers,
} from '@/lib/cashier/customer/customer.api';

// Search khách theo q
export function useCustomerSearch(q: string) {
  const enabled = q.trim().length > 0;
  return useQuery({
    queryKey: ['customers', 'search', q],
    queryFn: () => searchCustomers(q),
    enabled,
    staleTime: 30_000,
    // đảm bảo luôn là mảng
    select: (data) => Array.isArray(data) ? data : [],
  });
}
