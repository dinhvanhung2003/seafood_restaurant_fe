"use client";
import { isUUID } from "@/lib/uuid";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Cần thêm Badge cho đẹp
import { ScrollArea } from "@/components/ui/scroll-area"; // Nếu danh sách dài
import { Separator } from "@/components/ui/separator"; // Đường kẻ phân cách
import { useComboDetailQuery } from "@/hooks/admin/useCombo";
import { Package, Utensils } from "lucide-react"; // Icon trang trí

// Format tiền tệ
function formatVND(x: string | number) {
  const n = typeof x === "string" ? Number(x) : x;
  return Number.isNaN(n)
    ? String(x)
    : n.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      });
}

// Format số lượng (bỏ số 0 thừa phía sau: 1.000 -> 1, 1.500 -> 1.5)
function formatQuantity(x: string | number) {
  const n = typeof x === "string" ? Number(x) : x;
  return Number.isNaN(n) ? String(x) : n.toLocaleString("vi-VN");
}

export default function ComboDetailDialog({
  id,
  open,
  onOpenChange,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const enabled = open && isUUID(id);
  const q = useComboDetailQuery(enabled ? id : undefined);
  const combo = q.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Chi tiết Combo
          </DialogTitle>
        </DialogHeader>

        {q.isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Đang tải thông tin...
          </div>
        ) : q.error ? (
          <div className="py-12 text-center text-red-500">
            {q.error.message}
          </div>
        ) : combo ? (
          <div className="flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="p-6 space-y-6">
                {/* --- PHẦN 1: THÔNG TIN CHUNG --- */}
                <div className="flex gap-5">
                  {/* Ảnh Combo */}
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border bg-slate-100">
                    {combo.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={combo.image}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Thông tin chữ */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {combo.name}
                      </h3>
                      {combo.description ? (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {combo.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          Không có mô tả
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase font-semibold">
                          Giá bán
                        </span>
                        <div className="text-lg font-bold text-blue-600">
                          {formatVND(combo.price)}
                        </div>
                      </div>

                      <div className="h-8 w-px bg-border"></div>

                      <div>
                        <span className="text-xs text-muted-foreground uppercase font-semibold block mb-1">
                          Trạng thái
                        </span>
                        {combo.isAvailable ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700">
                            Đang bán
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Tạm ẩn</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* --- PHẦN 2: DANH SÁCH THÀNH PHẦN --- */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    Thành phần combo{" "}
                    <span className="text-muted-foreground font-normal">
                      ({combo.components?.length ?? 0} món)
                    </span>
                  </h4>

                  <div className="grid gap-3">
                    {(combo.components?.length ?? 0) === 0 ? (
                      <div className="text-sm text-muted-foreground italic py-2">
                        Chưa có thành phần nào.
                      </div>
                    ) : (
                      combo.components!.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-md border bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Ảnh nhỏ của món thành phần */}
                            <div className="w-12 h-12 rounded overflow-hidden border bg-white flex-shrink-0">
                              {c.item?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={c.item.image}
                                  alt={c.item?.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[10px] text-muted-foreground">
                                  N/A
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="font-medium text-sm">
                                {c.item?.name ?? "Sản phẩm không xác định"}
                              </div>
                              {/* Nếu cần hiển thị giá gốc của món lẻ, có thể thêm ở đây */}
                              <div className="text-xs text-muted-foreground">
                                Giá gốc: {formatVND(c.item?.price ?? 0)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-muted-foreground mr-2">
                              Số lượng
                            </span>
                            <span className="font-bold text-slate-900 text-lg">
                              x {formatQuantity(c.quantity)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : null}

        <DialogFooter className="p-4 border-t bg-slate-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
