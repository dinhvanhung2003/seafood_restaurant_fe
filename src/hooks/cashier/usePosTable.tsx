// hooks/cashier/usePosTable.ts
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/axios";

type TablesQuery = {
  page?: number;
  limit?: number;
  area?: string;          // ✅ tên khu vực (string) — đúng với DTO hiện tại
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export function usePosTables(q: TablesQuery) {
  const params: any = {
    page:  q.page  ?? 1,
    limit: q.limit ?? 24,
  };

  if (q.area)   params.area   = q.area;   // ✅ gửi "area" = tên khu vực
  if (q.search) params.search = q.search;
  if (q.status) params.status = q.status;

  const query = useQuery({
    queryKey: ["pos-tables", params],
    queryFn: async () => {
      const { data } = await api.get("/restauranttable/get-all-tables", { params });
      // data: { data: Table[], meta: {...} } hoặc theo wrapper của bạn
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const baseTables = (query.data?.data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    floor: t.area?.name ?? "",     // để filter client-side theo tab cũ nếu vẫn dùng
    seats: t.seats,
    // thêm field bạn cần…
  }));

  const meta = query.data?.meta ?? { page: 1, pages: 1, total: 0, limit: params.limit };

  return { query, baseTables, meta };
}
