// src/hooks/cashier/useOpenOrders.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
// ---- types từ BE ----
export type OpenOrderTable = {
  tableId: string;
  tableName: string;
  floor?: string;
  orderCount: number;
  totalAmount: number;   // tổng tiền của các đơn mở trên bàn
};

export type OpenOrderRow = {
  orderId: string;
  tableName?: string;
  customerName?: string;
  itemsCount: number;
  total: number;
  code: string; // ví dụ "Bàn 5-2e3a"
};

// Lấy danh sách BÀN có đơn mở (đổ vào combobox)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (s?: string) => !!s && UUID_RE.test(s);

// Lấy danh sách BÀN có đơn mở (đổ vào combobox)
export function useOpenOrderTables() {
  return useQuery({
    queryKey: ["open-tables"],
    queryFn: async () => {
      const res = await api.get("/orders/open-tables");
      // BE trả array trực tiếp: [{ tableId, tableName }]
      const rows = (Array.isArray(res.data) ? res.data : (res.data?.data ?? [])) as Array<{
        tableId: string; tableName: string;
      }>;
      // map về type OpenOrderTable (orderCount/totalAmount tạm ẩn nếu BE chưa trả)
      return rows.map(r => ({
        tableId: r.tableId,
        tableName: r.tableName,
        orderCount: undefined as unknown as number, // hoặc 0
        totalAmount: undefined as unknown as number,
      })) as OpenOrderTable[];
    },
    staleTime: 15_000,
  });
}



// Lấy danh sách ĐƠN mở của 1 bàn (hiện ở bảng phía dưới)

export function useOpenOrdersInTable(
  tableId?: string,
  opts?: { excludeOrderId?: string }
) {
  return useQuery({
    enabled: !!tableId,
    queryKey: ["open-in-table", { tableId, excludeOrderId: opts?.excludeOrderId }],
    queryFn: async () => {
      // ⬇️ ĐỔI open-by-table -> open-in-table + truyền excludeOrderId
      const res = await api.get("/orders/open-in-table", {
        params: { tableId, excludeOrderId: opts?.excludeOrderId },
      });

      const rows = (Array.isArray(res.data) ? res.data : (res.data?.data ?? [])) as Array<{
        id: string;
        tableName?: string;
        customerName?: string;
        itemsCount?: number;
        total?: number;
      }>;

      return rows.map((r) => ({
        orderId: r.id,
        tableName: r.tableName,
        customerName: r.customerName,
        itemsCount: r.itemsCount ?? 0,
        total: r.total ?? 0,
        code: `${(r.tableName ?? "").split(" ").pop() ?? ""}-${r.id.slice(0, 4)}`
      }));
    },
    staleTime: 15_000,
  });
}


