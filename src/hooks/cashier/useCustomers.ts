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

// Gắn khách vào order
export function useAttachCustomer(orderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { customerId?: string; phone?: string; name?: string; walkin?: boolean }) => {
      if (!orderId) throw new Error('missing orderId');
      return attachCustomerToOrder(orderId, body);
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['orders'] }),
        orderId ? qc.invalidateQueries({ queryKey: ['orders', orderId] }) : Promise.resolve(),
      ]);
    },
  });
}

// Tạo khách & gắn vào order
export function useCreateCustomerAndAttach(orderId?: string) {
  const qc = useQueryClient();
  const attachMu = useAttachCustomer(orderId);

  return useMutation({
    // Ưu tiên endpoint gộp (1 call). Nếu thiếu orderId, fallback: create -> attach (no-op attach)
    mutationFn: async (payload: any) => {
      if (orderId) {
        // BE route gộp: POST /orders/:orderId/customers
        const result = await createAndAttachCustomer(orderId, payload);
        return result; // có thể gồm { ok, orderId, customerId, customer }
      } else {
        // Không có orderId thì chỉ tạo khách
        const c = await createCustomer(payload);
        return c;
      }
    },
    onSuccess: async (_res, _vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['orders'] }),
        orderId ? qc.invalidateQueries({ queryKey: ['orders', orderId] }) : Promise.resolve(),
      ]);
    },
    // Nếu BE không có endpoint gộp (phòng hờ), bạn có thể bật fallback:
    onError: async (_err, payload) => {
      // Fallback “create -> attach” nếu có orderId mà endpoint gộp lỗi do 404
      if (orderId) {
        const c = await createCustomer(payload);
        await attachMu.mutateAsync({ customerId: c.id });
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['orders'] }),
          qc.invalidateQueries({ queryKey: ['orders', orderId] }),
        ]);
        return c;
      }
      throw _err;
    },
  });
}
