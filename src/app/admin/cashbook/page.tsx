"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCashbookList } from "@/hooks/admin/useCashBook";
import { CashbookFilters } from "@/components/admin/cashbook/filter/CashbookFilters";
import { CashbookTable } from "@/components/admin/cashbook/table/CashBookTable";
import { Paginator } from "@/components/admin/cashbook/panigator/Panigator";
import { CashbookDetailModal } from "@/components/admin/cashbook/modal/CashBookDetailModal";
import { CashBookCreateModal } from "@/components/admin/cashbook/modal/CashBookCreateModal";

export default function CashbookListPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [params, setParams] = React.useState<Record<string, any>>({
    page: 1,
    limit: 15,
    sortBy: "date",
    sortDir: "DESC",
  });

  const [detailId, setDetailId] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(false);

  const { data, isLoading, isFetching, refetch } = useCashbookList(params);

  const rows = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, pages: 1, page: 1, limit: 15 };

  const openDetail = (id: string) => {
    setDetailId(id);
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sổ quỹ</h1>
        <div className="text-sm text-muted-foreground">
            Tổng số bản ghi: {meta.total}
        </div>
      </div>

      <CashbookFilters onApply={setParams} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <Button onClick={() => setCreateOpen(true)}>+ Thêm phiếu</Button>
<CashBookCreateModal
  open={createOpen}
  onOpenChange={setCreateOpen}
  onSuccess={() => refetch()}
/>
          <CardTitle className="text-base">Danh sách ({meta.total})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Đang tải dữ liệu…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Không có dữ liệu phù hợp
            </div>
          ) : (
            <>
              <CashbookTable rows={rows} onOpenDetail={openDetail} />
              <Paginator
                page={meta.page}
                pages={meta.pages}
                onChange={(p) => setParams((s) => ({ ...s, page: p }))}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CashbookDetailModal id={detailId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
