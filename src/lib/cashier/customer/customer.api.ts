import api from '@/lib/axios';

// Tìm khách
export const searchCustomers = async (q: string, limit = 8) => {
  const res = await api.get('/customers/search', { params: { q, limit } });
  // controller trả mảng; vẫn hỗ trợ trường hợp bọc data
  return res.data?.data ?? res.data ?? [];
};

// Tạo khách (không đính kèm order)
export const createCustomer = async (payload: any) => {
  const res = await api.post('/customers', payload);
  return res.data;
};

// Gắn khách vào order (đã có customerId hoặc walkin)
export const attachCustomerToOrder = async (
  orderId: string,
  body: { customerId?: string; phone?: string; name?: string; walkin?: boolean }
) => {
  const res = await api.post(`/orders/${orderId}/attach-customer`, body);
  return res.data;
};

// Tạo khách & gắn vào order trong 1 call (BE đã có route này)
export const createAndAttachCustomer = async (orderId: string, payload: any) => {
  const res = await api.post(`/orders/${orderId}/customers`, payload);
  return res.data; // thường trả thông tin attach + customer
};
