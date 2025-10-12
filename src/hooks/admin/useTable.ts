// hooks/admin/useTable.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type {
  AreaDTO,
  DiningTableDTO,
  CreateAreaInput,
  CreateTableInput,
  TablesListResp,
  TablesQuery,
  TableTransactionsResp,
} from "@/types/admin/table/table";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
export type TxQuery = { page?: number; limit?: number; status?: string };
/** unwrap thông minh: nếu có .data thì trả .data, còn không trả raw */
const safeExtract = (raw: any) =>
  raw && typeof raw === "object" && "data" in raw ? (raw as any).data : raw;

/** ========== BÀN: LIST + CRUD (BE trả ResponseCommon) ========== */
const tables = createRestHooks<
  TablesListResp,
  DiningTableDTO,
  TablesQuery,
  CreateTableInput,
  Partial<CreateTableInput>
>({
  key: "tables",
  list:   { path: "/restauranttable/get-all-tables" },
  create: { path: "/restauranttable/create-table", method: "post" },
  update: { path: ({ id }: { id: string }) => `/restauranttable/${id}`, method: "put" },
  remove: { path: ({ id }: { id: string }) => `/restauranttable/${id}`, method: "delete" },
  extract: safeExtract, 
});

export const {
  useListQuery: useTablesQuery,
  useCreateMutation: useCreateTable,
  useUpdateMutation: useUpdateTable,
  useRemoveMutation: useDeleteTable,
} = tables;

/** ========== KHU VỰC: LIST + CREATE (BE có thể trả mảng thuần) ========== */
const areas = createRestHooks<
  AreaDTO[],
  AreaDTO,
  void,
  CreateAreaInput,
  Partial<CreateAreaInput>
>({
  key: "areas",
  list:   { path: "/area/get-list-area" },
  create: { path: "/area/create-area", method: "post" },
  extract: safeExtract, // ✅ ok cho cả mảng thuần lẫn ResponseCommon
});

export const {
  useListQuery: useAreas,
  useCreateMutation: useCreateArea,
} = areas;

export function useTableTransactions(tableId: string, q: TxQuery) {
  const params = { page: q.page ?? 1, limit: q.limit ?? 10, ...(q.status ? { status: q.status } : {}) };

  return useQuery({
    queryKey: ["table-transactions", tableId, params],
    queryFn: async () => {
      const { data } = await api.get<{ data: TableTransactionsResp }>(
        `/restauranttable/${tableId}/transactions`,
        { params }
      );
      return data.data; // BE bọc ResponseCommon → lấy .data
    },
    enabled: !!tableId,
    staleTime: 30_000,
  });
}
