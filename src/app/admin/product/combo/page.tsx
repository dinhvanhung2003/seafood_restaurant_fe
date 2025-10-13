"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCombosQuery, useDeleteComboMutation } from "@/hooks/admin/useCombo";
import ComboTable from "@/components/admin/product/menu/combo/ComboTable";
import ComboDetailDialog from "@/components/admin/product/menu/combo/ComboDetailDialog";
import ComboCreateDialog from "@/components/admin/product/menu/combo/CreateComboDialog";
import ComboUpdateDialog from "@/components/admin/product/menu/combo/ComboUpdateDialog";


export default function ComboPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const q = useCombosQuery({ page, limit });
  const del = useDeleteComboMutation();

  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [openCreate, setOpenCreate] = useState(false);

  const pages = q.data?.totalPages ?? 1;
  const total = q.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <ComboTable
        data={q.data?.data}
        total={total}
        page={q.data?.page ?? page}
        pages={pages}
        isLoading={q.isLoading}
        isFetching={q.isFetching}
        error={q.error ?? null}
        isPlaceholderData={!!q.isPlaceholderData}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pages, p + 1))}
        onRefresh={() => q.refetch()}
        onOpenDetail={(id) => setDetailId(id)}
        onEdit={(id) => setEditId(id)}
        onDelete={(id) => del.mutate(id, { onSuccess: () => q.refetch() })}
        CreateButton={<Button onClick={() => setOpenCreate(true)}>+ Tạo combo</Button>}
      />

    {detailId && (
  <ComboDetailDialog
    id={detailId}
    open
    onOpenChange={(v) => !v && setDetailId(undefined)}
  />
)}

{editId && (
  <ComboUpdateDialog
    id={editId}
    open
    onOpenChange={(v) => !v && setEditId(undefined)}
    onUpdated={() => q.refetch()}
  />
)}

      <ComboCreateDialog open={openCreate} onOpenChange={setOpenCreate} onCreated={() => q.refetch()} />

  
    </div>
  );
}
