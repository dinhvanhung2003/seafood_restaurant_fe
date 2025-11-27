"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useCashbookList,
  useDeleteCashbookEntry,
} from "@/hooks/admin/useCashBook"; // [MỚI] Import useDeleteCashbookEntry
import { CashbookFilters } from "@/components/admin/cashbook/filter/CashbookFilters";
import { CashbookTable } from "@/components/admin/cashbook/table/CashBookTable";
import { Paginator } from "@/components/admin/cashbook/panigator/Panigator";
import { CashbookDetailModal } from "@/components/admin/cashbook/modal/CashBookDetailModal";
import { CashBookCreateModal } from "@/components/admin/cashbook/modal/CashBookCreateModal";
import { CashbookSummaryBar } from "@/components/admin/cashbook/bar/CashbookSummaryBar";
// [MỚI] Import components Dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { EditCashbookModal } from "@/components/admin/cashbook/modal/EditCashbookModal";

export default function CashbookListPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [params, setParams] = React.useState<Record<string, any>>({
    page: 1,
    limit: 10,
    sortBy: "date",
    sortDir: "DESC",
  });

  const [detailId, setDetailId] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(false);

  const { data, isLoading, isFetching, refetch } = useCashbookList(params);

  // [MỚI] Hook xóa
  const deleteMut = useDeleteCashbookEntry();
  const [deleteItem, setDeleteItem] = React.useState<any>(null); // Lưu item đang muốn xóa

  const rows = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, pages: 1, page: 1, limit: 10 };
  const summary = data?.summary;

  const openDetail = (id: string) => {
    setDetailId(id);
    setOpen(true);
  };
  const [editItem, setEditItem] = React.useState<any>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  // [MỚI] Hàm xử lý xóa
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMut.mutateAsync(deleteItem.id);
      toast.success("Đã xóa phiếu thành công");
      setDeleteItem(null);
      // refetch(); // mutation onSuccess đã tự làm việc này
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Xóa thất bại";
      toast.error(msg);
    }
  };
  const handleEdit = (item: any) => {
    setEditItem(item);
    setEditOpen(true);
  };
  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* ... (Phần Header và Filter giữ nguyên) ... */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sổ quỹ</h1>
        <div className="text-sm text-muted-foreground">
          Tổng số bản ghi: {meta.total}
        </div>
      </div>

      <CashbookFilters onApply={setParams} />

      <CashbookSummaryBar
        summary={summary}
        loading={isLoading && !rows.length}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateOpen(true)}>+ Thêm phiếu</Button>
            <CashBookCreateModal
              open={createOpen}
              onOpenChange={setCreateOpen}
              onSuccess={() => refetch()}
            />
          </div>

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
              {/* [MỚI] Truyền hàm onDelete xuống Table */}
              <CashbookTable
                rows={rows}
                onOpenDetail={openDetail}
                onDelete={(item) => setDeleteItem(item)}
                onEdit={handleEdit}
              />
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

      {/* [MỚI] Dialog Xác Nhận Xóa */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa phiếu{" "}
              {deleteItem?.type === "RECEIPT" ? "Thu" : "Chi"}?
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p>
                  Bạn có chắc chắn muốn xóa phiếu <b>{deleteItem?.code}</b>?
                </p>

                {/* Cảnh báo thông minh */}
                {deleteItem?.purchaseReceipt && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800">
                    <strong>Lưu ý quan trọng:</strong>
                    <br />
                    Phiếu chi này được tạo tự động từ Phiếu nhập hàng{" "}
                    <b>{deleteItem.purchaseReceipt.code}</b>.
                    <br />
                    Nếu xóa, phiếu nhập hàng sẽ bị tính lại công nợ (trở về
                    trạng thái <b>Chưa thanh toán</b>).
                  </div>
                )}

                {deleteItem?.invoice && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800">
                    <strong>Lưu ý quan trọng:</strong>
                    <br />
                    Phiếu thu này gắn liền với Hóa đơn{" "}
                    <b>{deleteItem.invoice.invoiceNumber || "..."}</b>.
                    <br />
                    Nếu xóa, hóa đơn này sẽ bị tính lại là{" "}
                    <b>Chưa thanh toán</b>.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Đang xóa..." : "Xác nhận Xóa"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editItem && (
        <EditCashbookModal
          open={editOpen}
          onOpenChange={setEditOpen}
          item={editItem}
        />
      )}
    </div>
  );
}
