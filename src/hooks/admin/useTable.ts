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
  PageMeta,
} from "@/types/admin/table/table";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export type TxQuery = { page?: number; limit?: number; status?: string };

/** ===== extract dành riêng cho tables: giữ nguyên cả meta ===== */
function extractTables(raw: any): TablesListResp | any {
  // Envelope: { code, success, message, data: [...], meta: {...} }
  if (raw && typeof raw === "object" && Array.isArray(raw.data) && raw.meta) {
    return { data: raw.data, meta: raw.meta } as TablesListResp;
  }
  // fallback: nếu API trả mảng thuần
  if (Array.isArray(raw)) {
    const meta: PageMeta = { total: raw.length, page: 1, limit: raw.length, pages: 1 };
    return { data: raw, meta } as TablesListResp;
  }
  return raw;
}

/** ========== BÀN: LIST + CRUD (BE trả ResponseCommon có meta) ========== */
const tables = createRestHooks<
  TablesListResp,                 // TList
  DiningTableDTO,                 // TItem
  TablesQuery,                    // TListQuery
  CreateTableInput,               // TCreateDto
  Partial<CreateTableInput>       // TUpdateDto
>({
  key: "tables",
  list:   { path: "/restauranttable/get-all-tables" },
  create: { path: "/restauranttable/create-table", method: "post" },
  update: { path: ({ id }: { id: string }) => `/restauranttable/${id}`, method: "put" },
  remove: { path: ({ id }: { id: string }) => `/restauranttable/${id}`, method: "delete" },
  extract: extractTables,         // ⬅️ giữ { data, meta }
});

export const {
  useListQuery: useTablesQuery,
  useCreateMutation: useCreateTable,
  useUpdateMutation: useUpdateTable,
  useRemoveMutation: useDeleteTable,
} = tables;

/** ===== extract areas: nhận mảng thuần hoặc envelope {data: [...]} ===== */
function extractAreas(raw: any): AreaDTO[] | any {
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data as AreaDTO[];
  return raw;
}

/** ========== KHU VỰC: LIST + CREATE ========== */
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
  extract: extractAreas,
});

export const {
  useListQuery: useAreas,
  useCreateMutation: useCreateArea,
} = areas;

/** ========== Giao dịch của bàn (BE bọc ResponseCommon, không có meta ở envelope) ========== */
export function useTableTransactions(tableId: string, q: TxQuery) {
  const params = {
    page:  q.page  ?? 1,
    limit: q.limit ?? 10,
    ...(q.status ? { status: q.status } : {}),
  };

  return useQuery({
    queryKey: ["table-transactions", tableId, params],
    queryFn: async () => {
      const { data } = await api.get<{ data: TableTransactionsResp }>(
        `/restauranttable/${tableId}/transactions`,
        { params }
      );
      return data.data; // lấy phần data bên trong envelope
    },
    enabled: !!tableId,
    staleTime: 30_000,
  });
}
