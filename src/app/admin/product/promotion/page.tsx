"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import PromotionFilters from "../../../../components/admin/product/promotion/PromotionFilters";
import PromotionTable from "../../../../components/admin/product/promotion/PromotionTable";
import {
  usePromotionsQuery,
  usePromotionToggleMutation,
  usePromotionSoftDeleteMutation,
  usePromotionRestoreMutation,
} from "@/hooks/admin/usePromotion";
import PromotionDetailDialog from "@/components/admin/product/promotion/PromotionDetailDialog";

export default function PromotionsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [detailId, setDetailId] = useState<string | undefined>();
  const [openDetail, setOpenDetail] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      isActive: status === "all" ? undefined : status,
      includeDeleted,
    }),
    [page, limit, debouncedSearch, status, includeDeleted]
  );

  const { data, isLoading } = usePromotionsQuery(params);
  console.log("promotions data", data);
  const toggle = usePromotionToggleMutation();
  const del = usePromotionSoftDeleteMutation();
  const restore = usePromotionRestoreMutation();

  const items = data?.items ?? [];
  console.log("promotions data", items);
  const meta = {
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? items.length,
    totalPages: data?.page ?? Math.max(1, Math.ceil(items.length / limit)),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Khuyến mãi</h2>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked);
              setPage(1);
            }}
          />
          Hiển thị đã xoá
        </label>
      </div>

      <PromotionFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
      />

      <PromotionTable
        data={items}
        page={meta.page}
        pages={meta.totalPages}
        total={meta.total}
        isLoading={isLoading}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
        onGoto={(n) => setPage(n)}
        onToggle={(id, v) => toggle.mutate({ id, isActive: v })}
        onShowDetail={(id) => {
          setDetailId(id);
          setOpenDetail(true);
        }}
        onDelete={(id) => del.mutate(id)}
        onRestore={(id) => restore.mutate(id)}
      />

      <PromotionDetailDialog
        id={detailId}
        open={openDetail}
        onOpenChange={setOpenDetail}
      />
    </div>
  );
}
