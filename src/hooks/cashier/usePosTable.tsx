// hooks/cashier/usePosTable.ts
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/axios";

type TablesQuery = {
  page?: number;
  limit?: number;
  area?: string;         
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export function usePosTables(q: TablesQuery) {
  const params: any = {
    page:  q.page  ?? 1,
    limit: q.limit ?? 24,
  };

  if (q.area)   params.area   = q.area;  
  if (q.search) params.search = q.search;
  if (q.status) params.status = q.status;

  const query = useQuery({
    queryKey: ["pos-tables", params],
    queryFn: async () => {
      const { data } = await api.get("/restauranttable/get-all-tables", { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const baseTables = (query.data?.data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    floor: t.area?.name ?? "",    
    seats: t.seats,
  }));

  const meta = query.data?.meta ?? { page: 1, pages: 1, total: 0, limit: params.limit };

  return { query, baseTables, meta };
}
